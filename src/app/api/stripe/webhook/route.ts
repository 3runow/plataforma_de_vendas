import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { MelhorEnvioService } from "@/lib/melhor-envio";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET não configurado nas variáveis de ambiente. Configure a variável STRIPE_WEBHOOK_SECRET no arquivo .env");
}

// Garantir ao TypeScript que webhookSecret é string (já foi verificado acima)
const WEBHOOK_SECRET: string = webhookSecret;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(paymentIntent);
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(failedPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { order_id, user_id, payment_method } = paymentIntent.metadata;

  console.log("✅ Pagamento confirmado:", {
    paymentIntentId: paymentIntent.id,
    order_id,
    user_id,
    payment_method,
  });

  if (order_id && user_id) {
    const orderId = parseInt(order_id);
    if (isNaN(orderId)) {
      console.error("ID do pedido inválido no webhook:", order_id);
      return;
    }
    
    // Busca o pedido com os itens
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (order) {
      // Atualiza o status do pedido
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId: paymentIntent.id,
          paymentStatus: "approved",
          paymentMethod: payment_method || "unknown",
          status: "processing",
        },
      });

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

      // Limpa o carrinho após confirmar o pagamento
      const deletedCartItems = await prisma.cartItem.deleteMany({
        where: { userId: parseInt(user_id) },
      });
      console.log(`🛒 Carrinho limpo via webhook: ${deletedCartItems.count} itens removidos`);

      console.log(`✅ Pedido ${order_id} atualizado para processamento`);

      // 🚀 COMPRA AUTOMÁTICA DE FRETE
      // Configure MELHOR_ENVIO_AUTO_PURCHASE=true no .env para ativar
      if (process.env.MELHOR_ENVIO_AUTO_PURCHASE === 'true') {
        console.log(`📦 Iniciando compra automática de frete para pedido ${order_id}...`);
      try {
        const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
        if (!melhorEnvioToken) {
          console.error('❌ MELHOR_ENVIO_TOKEN não configurado');
          return;
        }

        const melhorEnvio = new MelhorEnvioService({
          token: melhorEnvioToken,
          sandbox: process.env.MELHOR_ENVIO_SANDBOX === 'true',
        });
        
        // Busca o pedido completo com endereço e itens
        const fullOrder = await prisma.order.findUnique({
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

        if (!fullOrder || !fullOrder.address) {
          console.error(`❌ Pedido ${order_id} sem endereço, impossível comprar frete`);
          return;
        }

        // Busca o serviceId padrão ou usa PAC (ID: 1)
        // Você pode salvar o serviceId escolhido no pedido anteriormente
        const defaultServiceId = 1; // PAC

        const shippingResult = await melhorEnvio.purchaseShipping({
          serviceId: defaultServiceId,
          from: {
            postal_code: process.env.STORE_CEP || '11045003',
          },
          to: {
            postal_code: fullOrder.address.cep,
            name: fullOrder.address.recipientName,
            phone: fullOrder.user.phone || '1140004000',
            email: fullOrder.user.email,
            document: fullOrder.user.cpf || '12345678909',
            address: fullOrder.address.street,
            number: fullOrder.address.number,
            district: fullOrder.address.neighborhood,
            city: fullOrder.address.city,
            state_abbr: fullOrder.address.state,
          },
          products: fullOrder.items.map((item) => ({
            id: item.product.id.toString(),
            width: 20,
            height: 10,
            length: 30,
            weight: 0.3,
            insurance_value: Number(item.product.price),
            quantity: item.quantity,
          })),
        });

        console.log(`✅ Frete comprado automaticamente:`, shippingResult);
      } catch (shippingError) {
        console.error(`❌ Erro ao comprar frete automaticamente para pedido ${order_id}:`, shippingError);
        // Não falha o webhook, apenas loga o erro
        // O admin pode comprar manualmente depois
      }
      } else {
        console.log(`ℹ️  Compra automática de frete desativada. Configure MELHOR_ENVIO_AUTO_PURCHASE=true no .env para ativar.`);
      }
    }
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { order_id, user_id } = paymentIntent.metadata;

  if (order_id && user_id) {
    const orderId = parseInt(order_id);
    if (isNaN(orderId)) {
      console.error("ID do pedido inválido no webhook:", order_id);
      return;
    }
    
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: paymentIntent.id,
        paymentStatus: "failed",
        status: "cancelled",
      },
    });
  }
}
