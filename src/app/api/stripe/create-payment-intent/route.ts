import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      currency = "brl",
      paymentMethod,
      payerEmail,
      payerName,
      payerCpf,
      orderId,
    } = body;

    if (!amount || !payerEmail) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        payer_email: payerEmail,
        payer_name: payerName,
        payer_cpf: payerCpf,
        order_id: orderId || "",
        payment_method: paymentMethod,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Erro ao criar payment intent:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
