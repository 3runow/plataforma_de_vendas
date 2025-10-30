import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyAuth } from "@/lib/auth";

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

    // Boleto (REAL via Stripe Payment Element)
    if (paymentMethod === "boleto") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency, // "brl"
        payment_method_types: ["boleto"],
        metadata: {
          user_id: user.id,
          payer_email: payerEmail,
          payer_name: payerName,
          payer_cpf: payerCpf,
          order_id: orderId?.toString() || "",
          payment_method: paymentMethod,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    // Configuração específica para PIX (simulado)
    if (paymentMethod === "pix") {
      // Para contas Stripe que não têm PIX habilitado, simulamos o comportamento
      // Em produção, você precisará habilitar PIX na sua conta Stripe

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
          order_id: orderId?.toString() || "",
          payment_method: paymentMethod,
        },
      });

      // Simula dados do PIX para demonstração
      const pixData = {
        hosted_voucher_url: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=PIX_SIMULADO_${paymentIntent.id}`,
        instructions: {
          amount: Math.round(amount),
          qr_code: `PIX_SIMULADO_${paymentIntent.id}`,
          qr_code_text: `PIX Simulado - Pedido ${orderId}`,
        },
      };

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        pixData: pixData,
        isSimulated: true, // Flag para indicar que é simulado
      });
    }

    // Para cartão de crédito, usa automatic_payment_methods
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
        order_id: orderId?.toString() || "",
        payment_method: paymentMethod,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
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
