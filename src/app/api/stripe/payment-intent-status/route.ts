import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

interface PIXInstructions {
  hosted_voucher_url?: string;
  instructions?: {
    amount?: number;
    qr_code?: string;
    qr_code_text?: string;
  };
}

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

    // Busca o payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ["payment_method"],
      }
    );

    // Verifica se o payment intent pertence ao usuário
    const orderId = paymentIntent.metadata?.order_id;
    if (paymentIntent.metadata?.user_id !== user.id.toString()) {
      return NextResponse.json(
        { error: "Acesso negado a este pagamento" },
        { status: 403 }
      );
    }

    // Extrai o QR code PIX se existir
    const pixData = paymentIntent.next_action
      ?.display_bank_transfer_instructions
      ? {
          hosted_voucher_url: (
            paymentIntent.next_action
              .display_bank_transfer_instructions as PIXInstructions
          ).hosted_voucher_url,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        }
      : null;

    return NextResponse.json({
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
      pixData: pixData,
    });
  } catch (error) {
    console.error("Erro ao buscar payment intent:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar status do pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
