import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentId, paymentMethod, paymentStatus } = body as {
      orderId?: number;
      paymentId?: string;
      paymentMethod?: string;
      paymentStatus?: string;
    };

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID é obrigatório" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const nextStatus =
      paymentStatus === "approved" ? "processing" : order.status;

    const updated = await prisma.order.update({
      where: { id: orderId },
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
    return NextResponse.json(
      {
        error: "Erro ao atualizar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
