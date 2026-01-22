import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWebhookUrl, mercadoPagoPayment } from "@/lib/mercado-pago";

const paymentSchema = z.object({
  orderId: z.number().int().positive(),
  transactionAmount: z.number().positive(),
  paymentMethodId: z.string().min(2),
  token: z.string().optional(),
  issuerId: z.union([z.string(), z.number()]).optional(),
  installments: z.number().int().positive().optional(),
  payer: z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    identification: z
      .object({
        type: z.string().default("CPF"),
        number: z.string(),
      })
      .optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados invalidos",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const {
      orderId,
      transactionAmount,
      paymentMethodId,
      token,
      issuerId,
      installments,
      payer,
    } = parsed.data;

    const authUser = await verifyAuth(request).catch(() => null);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido nao encontrado" },
        { status: 404 },
      );
    }

    // Regra de acesso:
    // - Se autenticado, precisa ser dono do pedido.
    // - Se não autenticado:
    //   - permite para pedidos de guest
    //   - ou permite se o email+CPF informados batem com o usuário do pedido (cliente já cadastrado mas não logado)
    if (authUser && order.userId !== authUser.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const payerNameParts = (payer.firstName || payer.lastName)
      ? [payer.firstName || "", payer.lastName || ""]
      : (order.user?.name || "").split(" ");

    const firstName =
      payer.firstName ||
      (payerNameParts.length > 0 ? payerNameParts[0] : "Cliente");
    const lastName =
      payer.lastName ||
      (payerNameParts.length > 1 ? payerNameParts.slice(1).join(" ") : "");

    const identificationNumber =
      payer.identification?.number?.replace(/\D/g, "") ||
      order.user?.cpf?.replace(/\D/g, "");

    // Validar CPF antes de enviar ao Mercado Pago
    if (!identificationNumber || identificationNumber.length !== 11) {
      console.error("CPF inválido:", {
        payerCpf: payer.identification?.number,
        userCpf: order.user?.cpf,
        cleanedCpf: identificationNumber,
      });
      return NextResponse.json(
        { error: "CPF inválido. Por favor, informe um CPF válido com 11 dígitos." },
        { status: 400 },
      );
    }

    if (!authUser) {
      if (order.user?.isGuest === true) {
        // ok
      } else {
        const orderEmail = order.user?.email?.trim().toLowerCase() || "";
        const payerEmail = payer.email.trim().toLowerCase();
        const orderCpf = order.user?.cpf?.replace(/\D/g, "") || "";

        const hasMatch =
          orderEmail.length > 0 &&
          payerEmail === orderEmail &&
          orderCpf.length === 11 &&
          identificationNumber === orderCpf;

        if (!hasMatch) {
          return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
        }
      }
    }

    const metadata: Record<string, string> = {
      orderId: String(orderId),
    };
    const metadataUserId = authUser?.id ?? order.userId;
    if (metadataUserId) {
      metadata.userId = String(metadataUserId);
    }

    const payload: Record<string, unknown> = {
      transaction_amount: Number(transactionAmount.toFixed(2)),
      description: `Pedido #${orderId}`,
      payment_method_id: paymentMethodId,
      external_reference: String(orderId),
      metadata,
      payer: {
        email: payer.email,
        first_name: firstName,
        last_name: lastName,
        identification: identificationNumber
          ? {
            type: payer.identification?.type || "CPF",
            number: identificationNumber,
          }
          : undefined,
      },
    };

    const notificationUrl = getWebhookUrl();
    if (notificationUrl) {
      payload.notification_url = notificationUrl;
    }

    if (token) {
      payload.token = token;
    }

    if (issuerId) {
      payload.issuer_id = issuerId;
    }

    if (installments) {
      payload.installments = installments;
    }

    const payment = await mercadoPagoPayment.create({ body: payload });
    const paymentStatus = payment.status || "pending";
    const paymentMethod =
      payment.payment_method_id ||
      (payment.payment_method as { id?: string } | undefined)?.id ||
      paymentMethodId;

    const transactionData = (payment.point_of_interaction as {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
        external_resource_url?: string;
      };
    } | null)?.transaction_data;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: payment.id ? String(payment.id) : order.paymentId,
        paymentMethod,
        paymentStatus,
        status: paymentStatus === "approved" 
          ? "processing" 
          : paymentStatus === "rejected" 
            ? "payment_failed" 
            : order.status,
      },
    });

    return NextResponse.json({
      id: payment.id,
      status: paymentStatus,
      statusDetail: payment.status_detail,
      orderId,
      paymentMethod,
      qrCode: transactionData?.qr_code,
      qrCodeBase64: transactionData?.qr_code_base64,
      ticketUrl:
        transactionData?.ticket_url || transactionData?.external_resource_url,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento Mercado Pago:", error);
    const errorAny = error as {
      message?: unknown;
      code?: unknown;
      status?: unknown;
      cause?: unknown;
    };

    const message =
      error instanceof Error
        ? error.message
        : typeof errorAny?.message === "string"
          ? errorAny.message
          : "Erro interno ao criar pagamento";

    const mpStatus =
      typeof errorAny?.status === "number" ? (errorAny.status as number) : undefined;

    const details =
      Array.isArray(
        (error as { cause?: Array<{ description?: string; code?: string }> })
          .cause,
      )
        ? (error as { cause: Array<{ description?: string; code?: string }> })
            .cause
            .map((cause) =>
              [cause.code, cause.description].filter(Boolean).join(": "),
            )
            .filter(Boolean)
            .join(" | ")
        : null;

    const clientMessage = details?.length ? details : message;

    const code = typeof errorAny?.code === "string" ? errorAny.code : "";
    const normalized = `${code} ${String(message || "")} ${String(details || "")}`
      .toLowerCase();

    if (normalized.includes("invalid access token") || normalized.includes("unauthorized")) {
      return NextResponse.json(
        {
          error:
            "Pagamento indisponível: token do Mercado Pago inválido. Atualize MERCADO_PAGO_ACCESS_TOKEN e reinicie o servidor.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: clientMessage },
      { status: mpStatus && mpStatus >= 400 && mpStatus < 600 ? mpStatus : 500 },
    );
  }
}
