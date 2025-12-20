import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mercadoPagoPayment } from "@/lib/mercado-pago";

type PaymentResponse = {
  id?: string | number;
  status?: string;
  status_detail?: string;
  payment_method_id?: string;
  payment_method?: { id?: string } | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
      external_resource_url?: string;
    };
  } | null;
  external_reference?: string | null;
  metadata?:
    | { orderId?: number | string; userId?: number | string }
    | null;
};

async function resolveStatus({
  paymentId,
  orderId,
  userId,
}: {
  paymentId: string;
  orderId?: number | null;
  userId: number;
}) {
  const payment = (await mercadoPagoPayment.get({
    id: paymentId,
  })) as PaymentResponse;

  const metadataOrderId =
    typeof payment.metadata?.orderId === "number"
      ? payment.metadata.orderId
      : typeof payment.metadata?.orderId === "string" &&
          /^\d+$/.test(payment.metadata.orderId)
        ? parseInt(payment.metadata.orderId, 10)
        : undefined;

  const resolvedOrderId =
    orderId ??
    (payment.external_reference &&
    /^\d+$/.test(payment.external_reference)
      ? parseInt(payment.external_reference, 10)
      : metadataOrderId);

  if (!resolvedOrderId || Number.isNaN(resolvedOrderId)) {
    return { payment, order: null };
  }

  const order = await prisma.order.findUnique({
    where: { id: resolvedOrderId },
  });

  if (!order) {
    return { payment, order: null };
  }

  if (order.userId !== userId) {
    throw new Error("Acesso negado ao pagamento informado");
  }

  const paymentMethod =
    payment.payment_method_id ||
    (payment.payment_method as { id?: string } | undefined)?.id ||
    order.paymentMethod ||
    "unknown";

  const nextStatus =
    payment.status === "approved"
      ? "processing"
      : payment.status === "rejected"
        ? "payment_failed"
        : order.status;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentId: payment.id ? String(payment.id) : order.paymentId,
      paymentStatus: payment.status,
      paymentMethod,
      status: nextStatus,
    },
  });

  return { payment, order };
}

function buildResponse(payment: PaymentResponse, orderId?: number) {
  const transactionData = payment.point_of_interaction?.transaction_data;

  return {
    paymentId: payment.id,
    status: payment.status,
    statusDetail: payment.status_detail,
    orderId,
    paymentMethod:
      payment.payment_method_id ||
      (payment.payment_method as { id?: string } | undefined)?.id,
    qrCode: transactionData?.qr_code,
    qrCodeBase64: transactionData?.qr_code_base64,
    ticketUrl:
      transactionData?.ticket_url || transactionData?.external_resource_url,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const paymentId = params.get("paymentId") || params.get("id");
    const orderIdParam = params.get("orderId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId e obrigatorio" },
        { status: 400 },
      );
    }

    const orderId =
      orderIdParam && /^\d+$/.test(orderIdParam)
        ? parseInt(orderIdParam, 10)
        : undefined;

    const { payment, order } = await resolveStatus({
      paymentId,
      orderId,
      userId: user.id,
    });

    return NextResponse.json(
      buildResponse(payment, order?.id ?? orderId ?? undefined),
    );
  } catch (error) {
    console.error("Erro ao consultar status do pagamento:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno ao consultar status";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const paymentId = body.paymentId || body.id;
    const orderId =
      typeof body.orderId === "number"
        ? body.orderId
        : typeof body.orderId === "string" && /^\d+$/.test(body.orderId)
          ? parseInt(body.orderId, 10)
          : undefined;

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId e obrigatorio" },
        { status: 400 },
      );
    }

    const { payment, order } = await resolveStatus({
      paymentId,
      orderId,
      userId: user.id,
    });

    return NextResponse.json(
      buildResponse(payment, order?.id ?? orderId ?? undefined),
    );
  } catch (error) {
    console.error("Erro ao consultar status do pagamento:", error);
    const message =
      error instanceof Error ? error.message : "Erro interno ao consultar status";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
