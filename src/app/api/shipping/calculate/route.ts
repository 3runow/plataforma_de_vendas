import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const MELHOR_ENVIO_API =
  process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br/api/v2/me"
    : "https://melhorenvio.com.br/api/v2/me";

interface ShippingItem {
  weight: number; // peso em kg
  width: number; // largura em cm
  height: number; // altura em cm
  length: number; // comprimento em cm
  quantity: number;
  insurance_value: number; // valor do produto
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, products } = body;

    if (!from || !to || !products || products.length === 0) {
      return NextResponse.json(
        { error: "Dados incompletos para cálculo de frete" },
        { status: 400 }
      );
    }

    // Preparar os produtos para a API do Melhor Envio
    const packages = products.map((item: ShippingItem) => ({
      weight: item.weight || 0.3, // peso mínimo padrão
      width: item.width || 11,
      height: item.height || 17,
      length: item.length || 11,
      quantity: item.quantity || 1,
      insurance_value: item.insurance_value,
    }));

    // Calcular frete usando Melhor Envio
    const response = await axios.post(
      `${MELHOR_ENVIO_API}/shipment/calculate`,
      {
        from: {
          postal_code: from.replace(/\D/g, ""), // Remove formatação do CEP
        },
        to: {
          postal_code: to.replace(/\D/g, ""),
        },
        products: packages,
        options: {
          receipt: false,
          own_hand: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    interface ShippingOptionResponse {
      id: number;
      name: string;
      company: { name: string };
      price: number;
      discount: number;
      delivery_time: number;
      delivery_range: { min: number; max: number };
      custom_price: number;
      error: string | null;
    }

    // Formatar resposta
    const shippingOptions = response.data.map((option: ShippingOptionResponse) => ({
      id: option.id,
      name: option.name,
      company: option.company.name,
      price: option.price,
      discount: option.discount,
      deliveryTime: option.delivery_time,
      deliveryRange: option.delivery_range,
      customPrice: option.custom_price,
      error: option.error,
    }));

    return NextResponse.json({
      success: true,
      options: shippingOptions,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao calcular frete:", errorMessage);

    return NextResponse.json(
      {
        error: "Erro ao calcular frete",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
