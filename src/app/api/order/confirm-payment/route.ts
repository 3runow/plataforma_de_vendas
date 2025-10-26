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
    const { orderId, paymentId, paymentStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID é obrigatório" },
        { status: 400 }
      );
    }

    // Busca o pedido com os itens
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Verifica se o pedido pertence ao usuário
    if (order.userId !== user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    console.log(
      "Confirmando pagamento para pedido:",
      orderId,
      "usuário:",
      user.id
    );

    // Atualiza o status do pedido
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: paymentId,
        paymentStatus: paymentStatus,
        status: "processing",
      },
    });

    console.log("Pedido atualizado:", {
      id: updatedOrder.id,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
    });

    // Reduz o estoque dos produtos
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

    return NextResponse.json({
      success: true,
      message: "Pagamento confirmado e estoque atualizado",
    });
  } catch (error) {
    console.error("Erro ao confirmar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao confirmar pagamento" },
      { status: 500 }
    );
  }
}
