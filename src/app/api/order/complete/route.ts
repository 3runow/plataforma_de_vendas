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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "ID do pedido é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o pedido
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar status do pedido para "processing"
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "processing",
        paymentStatus: "approved",
        updatedAt: new Date(),
      },
    });

    console.log("Pedido atualizado:", updatedOrder);

    // Reduzir estoque dos produtos
    for (const item of order.items) {
      console.log(
        `Reduzindo estoque do produto ${item.productId} em ${item.quantity} unidades`
      );

      const updatedProduct = await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      console.log(`Estoque atualizado para: ${updatedProduct.stock}`);
    }

    console.log("Pedido processado com sucesso:", {
      id: order.id,
      status: "processing",
      paymentStatus: "approved",
    });

    return NextResponse.json({
      success: true,
      message: "Pedido processado com sucesso",
      order: {
        id: order.id,
        status: "processing",
        paymentStatus: "approved",
      },
    });
  } catch (error) {
    console.error("Erro ao processar pedido:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar pedido",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
