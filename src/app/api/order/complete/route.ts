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

    // Validar orderId
    const orderIdNum = typeof orderId === 'string' ? parseInt(orderId) : orderId;
    if (!orderIdNum || isNaN(orderIdNum) || orderIdNum <= 0) {
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 }
      );
    }

    // Buscar o pedido
    const order = await prisma.order.findFirst({
      where: {
        id: orderIdNum,
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
      where: { id: orderIdNum },
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
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Erro ao processar pedido",
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : "Erro desconhecido",
        }),
      },
      { status: 500 }
    );
  }
}
