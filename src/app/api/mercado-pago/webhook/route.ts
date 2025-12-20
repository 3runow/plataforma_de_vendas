import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mercadoPagoPayment } from "@/lib/mercado-pago";
import { MelhorEnvioService } from "@/lib/melhor-envio";
import { buildOrderConfirmationEmail, sendEmail } from "@/lib/email";

async function sendConfirmationEmail(orderId: number) {
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    if (!fullOrder?.user?.email) {
      console.warn(
        "Nao foi possivel enviar email de confirmacao: usuario sem email",
        fullOrder?.userId,
      );
      return;
    }

    const html = buildOrderConfirmationEmail({
      customerName: fullOrder.user.name || "Cliente",
      orderId: fullOrder.id,
      orderTotal: Number(fullOrder.total),
      paymentMethod:
        fullOrder.paymentMethod === "pix"
          ? "PIX"
          : fullOrder.paymentMethod || "Cartao",
      items: fullOrder.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        imageUrl:
          (item.product as unknown as { mainImageUrl?: string | null })
            .mainImageUrl || undefined,
      })),
    });

    await sendEmail({
      to: fullOrder.user.email,
      subject: `Seu pedido #${fullOrder.id} foi recebido - Bricks`,
      html,
      text: `Ola, ${
        fullOrder.user.name || "cliente"
      }! Recebemos o seu pedido #${fullOrder.id}. Total: R$ ${fullOrder.total}.`,
    });

    console.log("Email de confirmacao enviado para", fullOrder.user.email);
  } catch (error) {
    console.error("Erro ao enviar email de confirmacao:", error);
  }
}

async function maybeAutoPurchaseShipping(orderId: number) {
  if (process.env.MELHOR_ENVIO_AUTO_PURCHASE !== "true") {
    return;
  }

  try {
    const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
    if (!melhorEnvioToken) {
      console.error("MELHOR_ENVIO_TOKEN nao configurado");
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        address: true,
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || !order.address) {
      console.error("Pedido sem endereco, nao foi possivel comprar frete");
      return;
    }

    const melhorEnvio = new MelhorEnvioService({
      token: melhorEnvioToken,
      sandbox: process.env.MELHOR_ENVIO_SANDBOX === "true",
    });

    const defaultServiceId = 1;

    const shippingResult = await melhorEnvio.purchaseShipping({
      serviceId: defaultServiceId,
      from: {
        postal_code: process.env.STORE_CEP || "11045003",
      },
      to: {
        postal_code: order.address.cep,
        name: order.address.recipientName,
        phone: order.user.phone || "1140004000",
        email: order.user.email,
        document: order.user.cpf || "12345678909",
        address: order.address.street,
        number: order.address.number,
        district: order.address.neighborhood,
        city: order.address.city,
        state_abbr: order.address.state,
      },
      products: order.items.map((item) => ({
        id: item.product.id.toString(),
        width: 20,
        height: 10,
        length: 30,
        weight: 0.3,
        insurance_value: Number(item.product.price),
        quantity: item.quantity,
      })),
    });

    console.log("Frete comprado automaticamente:", shippingResult);
  } catch (error) {
    console.error(
      `Erro ao comprar frete automaticamente para pedido ${orderId}:`,
      error,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const searchParams = request.nextUrl.searchParams;

    const paymentId =
      body?.data?.id ||
      body?.id ||
      searchParams.get("id") ||
      searchParams.get("data.id");

    const topic =
      body?.type || searchParams.get("type") || searchParams.get("topic");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment id ausente no webhook" },
        { status: 400 },
      );
    }

    if (topic && topic !== "payment" && topic !== "test_notification") {
      return NextResponse.json({ received: true });
    }

    const payment = await mercadoPagoPayment.get({ id: String(paymentId) });

    const orderId =
      (payment.external_reference &&
        !Number.isNaN(parseInt(payment.external_reference, 10)) &&
        parseInt(payment.external_reference, 10)) ||
      (typeof payment.metadata?.orderId === "number"
        ? payment.metadata.orderId
        : undefined);

    if (!orderId) {
      console.warn("Webhook recebido sem orderId no metadata/external_reference");
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      console.warn("Pedido nao encontrado para webhook", orderId);
      return NextResponse.json({ received: true });
    }

    const paymentStatus = payment.status || "pending";
    const paymentMethod =
      payment.payment_method_id ||
      (payment.payment_method as { id?: string } | undefined)?.id ||
      order.paymentMethod ||
      "unknown";

    const alreadyApproved = order.paymentStatus === "approved";

    const nextStatus =
      paymentStatus === "approved"
        ? "processing"
        : paymentStatus === "rejected"
          ? "cancelled"
          : order.status;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: payment.id ? String(payment.id) : order.paymentId,
        paymentMethod,
        paymentStatus,
        status: nextStatus,
      },
    });

    if (paymentStatus === "approved" && !alreadyApproved) {
      await prisma.cartItem.deleteMany({
        where: { userId: order.userId },
      });

      await sendConfirmationEmail(orderId);
      await maybeAutoPurchaseShipping(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook do Mercado Pago:", error);
    return NextResponse.json(
      { error: "Falha ao processar webhook" },
      { status: 500 },
    );
  }
}
