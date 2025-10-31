import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { paymentIntentId, orderId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment Intent ID é obrigatório" },
        { status: 400 }
      );
    }

    // Busca o payment intent no Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ["payment_method"],
      }
    );

    // Verifica se o payment intent pertence ao usuário
    const metadataOrderId = paymentIntent.metadata?.order_id;
    const orderIdNum = orderId ? parseInt(orderId) : (metadataOrderId ? parseInt(metadataOrderId) : null);
    
    if (!orderIdNum) {
      return NextResponse.json(
        { error: "ID do pedido não encontrado" },
        { status: 400 }
      );
    }

    if (paymentIntent.metadata?.user_id !== user.id.toString()) {
      return NextResponse.json(
        { error: "Acesso negado a este pagamento" },
        { status: 403 }
      );
    }

    // Busca o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderIdNum },
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

    // Se o pagamento foi confirmado no Stripe, atualiza o pedido
    if (paymentIntent.status === "succeeded" && order.paymentStatus !== "approved") {
      console.log(`✅ Verificando e atualizando pedido ${orderIdNum} com pagamento confirmado`);

      await prisma.order.update({
        where: { id: orderIdNum },
        data: {
          paymentId: paymentIntent.id,
          paymentStatus: "approved",
          paymentMethod: paymentIntent.metadata?.payment_method || "card",
          status: "processing",
        },
      });

      // Reduz o estoque dos produtos se ainda não foi feito
      if (order.status === "pending") {
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
      }

      // Limpa o carrinho após confirmar o pagamento
      const deletedCartItems = await prisma.cartItem.deleteMany({
        where: { userId: user.id },
      });
      console.log(`🛒 Carrinho limpo: ${deletedCartItems.count} itens removidos`);

      console.log(`✅ Pedido ${orderIdNum} atualizado para processamento`);
    }

    // Retorna o status atualizado do pedido
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderIdNum },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    return NextResponse.json({
      success: true,
      paymentStatus: paymentIntent.status,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Erro ao verificar e atualizar pagamento:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

