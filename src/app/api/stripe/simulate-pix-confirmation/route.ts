import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID é obrigatório" },
        { status: 400 }
      );
    }

    console.log("🔍 Buscando pedido pendente para usuário:", user.id);

    // Busca o pedido mais recente do usuário que ainda está pendente
    const order = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: "pending",
        paymentStatus: null, // Ainda não foi pago
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc", // Pega o mais recente
      },
    });

    if (!order) {
      console.log(
        "❌ Nenhum pedido pendente encontrado para usuário:",
        user.id
      );
      return NextResponse.json(
        { error: "Nenhum pedido pendente encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Pedido encontrado:", {
      id: order.id,
      total: order.total,
      status: order.status,
      itemsCount: order.items.length,
    });

    // Simula a confirmação do pagamento
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: paymentIntentId,
        paymentStatus: "approved",
        paymentMethod: "pix",
        status: "processing",
      },
    });

    console.log("✅ Pagamento PIX simulado confirmado para pedido:", order.id);

    // Reduz o estoque dos produtos
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Pagamento PIX simulado confirmado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao simular confirmação PIX:", error);
    return NextResponse.json(
      {
        error: "Erro ao simular confirmação do pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
