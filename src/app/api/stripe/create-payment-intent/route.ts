import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyAuth } from "@/lib/auth";
import { resolveCheckoutUser } from "@/lib/checkout-user";
import { z } from "zod";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY não configurado nas variáveis de ambiente. Configure a variável STRIPE_SECRET_KEY no arquivo .env");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const paymentIntentSchema = z.object({
  amount: z.number().positive().max(999999.99),
  currency: z.enum(["brl"]).default("brl"),
  paymentMethod: z.enum(["boleto", "pix", "card", "credit_card"]),
  payerEmail: z.string().email().max(255),
  payerName: z.string().min(2).max(100).optional(),
  payerCpf: z.string().regex(/^[\d.-]+$/).optional().transform((val) => 
    val ? val.replace(/\D/g, "") : undefined
  ).refine((val) => !val || val.length === 11, {
    message: "CPF deve conter 11 dígitos"
  }),
  installments: z.number().int().positive().max(12).optional(),
  orderId: z.union([z.number().int().positive(), z.string()]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await verifyAuth(request);

    const body = await request.json();
    
    // Validar dados com Zod
    const validationResult = paymentIntentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          details: validationResult.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const {
      amount,
      currency,
      paymentMethod: rawPaymentMethod,
      payerEmail,
      payerName,
      payerCpf,
      orderId,
    } = validationResult.data;

    const sanitizedCpf = payerCpf || "";
    const checkoutCustomer = {
      name: payerName || "Cliente",
      email: payerEmail,
      cpf: sanitizedCpf,
      phone: undefined,
    };

    if (!authenticatedUser && sanitizedCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF é obrigatório para concluir o pagamento." },
        { status: 400 }
      );
    }

    let checkoutUserId = authenticatedUser?.id ?? null;

    if (!checkoutUserId) {
      const { user } = await resolveCheckoutUser(checkoutCustomer);
      checkoutUserId = user.id;
    }

    if (!checkoutUserId) {
      return NextResponse.json(
        { error: "Não foi possível identificar o cliente para o pagamento." },
        { status: 400 }
      );
    }
    
    // Normalizar paymentMethod: "credit_card" -> "card"
    const paymentMethod = rawPaymentMethod === "credit_card" ? "card" : rawPaymentMethod;
    
    const orderIdString = orderId ? String(orderId) : "";

    // Boleto (REAL via Stripe Payment Element)
    if (paymentMethod === "boleto") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency, // "brl"
        payment_method_types: ["boleto"],
        metadata: {
          user_id: String(checkoutUserId),
          payer_email: payerEmail,
          payer_name: payerName || "",
          payer_cpf: sanitizedCpf || "",
          order_id: orderIdString,
          payment_method: paymentMethod,
        },
      });

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    // PIX temporariamente desabilitado
    if (paymentMethod === "pix") {
      return NextResponse.json(
        {
          error: "Pagamento via PIX está temporariamente indisponível.",
        },
        { status: 400 }
      );
    }

    /*
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
          user_id: String(user.id),
          payer_email: payerEmail,
          payer_name: payerName || "",
          payer_cpf: cleanedCpf || "",
          order_id: orderIdString,
          payment_method: paymentMethod,
        },
      });

      // Simula dados do PIX para demonstração
      const pixData = {
        hosted_voucher_url: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=PIX_SIMULADO_${paymentIntent.id}`,
        instructions: {
          amount: Math.round(amount),
          qr_code: `PIX_SIMULADO_${paymentIntent.id}`,
          qr_code_text: `PIX Simulado - Pedido ${orderIdString}`,
        },
      };

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        pixData: pixData,
        isSimulated: true, // Flag para indicar que é simulado
      });
    }
    */

    // Para cartão de crédito, usa automatic_payment_methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: String(checkoutUserId),
        payer_email: payerEmail,
        payer_name: payerName || "",
        payer_cpf: sanitizedCpf || "",
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
    const isDevelopment = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Erro ao criar pagamento",
        ...(isDevelopment && {
          details: error instanceof Error ? error.message : "Erro desconhecido",
        }),
      },
      { status: 500 }
    );
  }
}
