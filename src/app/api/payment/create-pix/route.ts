import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, payer } = body;

    if (!amount || !payer) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: amount,
      description: "Pedido na loja online",
      payment_method_id: "pix",
      payer: {
        email: payer.email,
        first_name: payer.name?.split(" ")[0] || "Cliente",
        last_name: payer.name?.split(" ").slice(1).join(" ") || "",
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
    };

    const response = await payment.create({ body: paymentData });

    // O Mercado Pago retorna o QR Code no campo point_of_interaction
    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 =
      response.point_of_interaction?.transaction_data?.qr_code_base64;

    if (!qrCode) {
      return NextResponse.json(
        { error: "Erro ao gerar QR Code PIX" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: response.id,
      status: response.status,
      qrCode: qrCode,
      qrCodeBase64: qrCodeBase64,
      expirationDate: response.date_of_expiration,
    });
  } catch (error) {
    console.error("Erro ao criar pagamento PIX:", error);
    return NextResponse.json(
      {
        error: "Erro ao gerar pagamento PIX",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
