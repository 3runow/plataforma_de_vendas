import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      token,
      orderId,
      paymentMethodId,
      installments,
      issuerId,
      email,
      identificationType,
      identificationNumber,
    } = body;

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: "Pedido não pertence ao usuário" },
        { status: 403 }
      );
    }

    // Criar o pagamento no Mercado Pago
    const paymentData = {
      transaction_amount: order.total,
      token: token,
      description: `Pedido #${order.id}`,
      installments: installments,
      payment_method_id: paymentMethodId,
      issuer_id: issuerId,
      payer: {
        email: email,
        identification: {
          type: identificationType,
          number: identificationNumber,
        },
      },
      statement_descriptor: "LOJA_ONLINE",
      metadata: {
        order_id: order.id,
      },
    };

    const response = await payment.create({ body: paymentData });

    // Atualizar o pedido com as informações de pagamento
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: response.id?.toString(),
        paymentStatus: response.status,
        paymentMethod: response.payment_method_id,
        status: response.status === "approved" ? "processing" : "pending",
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: response.id,
        status: response.status,
        statusDetail: response.status_detail,
        paymentMethodId: response.payment_method_id,
      },
    });
  } catch (error: any) {
    console.error("Erro ao processar pagamento:", error);

    return NextResponse.json(
      {
        error: "Erro ao processar pagamento",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
