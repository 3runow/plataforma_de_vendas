import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { PAYMENT_RELATED_STATUSES, type OrderStatus } from "@/constants/order-status";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentId, paymentMethod, paymentStatus } = body;

    // Validar orderId
    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId) : orderId;
    if (!orderIdNum || isNaN(orderIdNum) || orderIdNum <= 0) {
      return NextResponse.json(
        { error: "Order ID inválido" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderIdNum } });
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    let nextStatus = order.status as OrderStatus;

    if (paymentStatus === "approved") {
      nextStatus = "processing";
    } else if (paymentStatus === "failed" || paymentStatus === "rejected") {
      nextStatus = "payment_failed";
    } else if (
      paymentStatus === "pending" &&
      PAYMENT_RELATED_STATUSES.includes(order.status as OrderStatus)
    ) {
      nextStatus = "payment_pending";
    }

    const updated = await prisma.order.update({
      where: { id: orderIdNum },
      data: {
        paymentId: paymentId ?? order.paymentId,
        paymentMethod: paymentMethod ?? order.paymentMethod,
        paymentStatus: paymentStatus ?? order.paymentStatus,
        status: nextStatus,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Erro ao atualizar pagamento do pedido:", error);
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Erro ao atualizar pagamento",
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : "Erro desconhecido",
        }),
      },
      { status: 500 }
    );
  }
}
