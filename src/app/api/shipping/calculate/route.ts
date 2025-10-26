import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const MELHOR_ENVIO_API =
  process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br/api/v2/me"
    : "https://melhorenvio.com.br/api/v2/me";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to, products } = body;

    console.log("Calculando frete:", { from, to, products });

    // Validar dados de entrada
    if (!from?.cep || !to?.cep || !products || !Array.isArray(products)) {
      console.log("Dados inválidos para cálculo de frete, usando fallback");
      return getFallbackShipping();
    }

    // Dados do remetente (sua loja)
    const fromData = {
      postal_code: from.cep.replace(/\D/g, ""), // Remove caracteres não numéricos
    };

    // Dados do destinatário
    const toData = {
      postal_code: to.cep.replace(/\D/g, ""), // Remove caracteres não numéricos
    };

    // Dados dos produtos
    const productsData = products.map((product: any) => ({
      id: product.id || Math.random().toString(),
      width: Number(product.width) || 10,
      height: Number(product.height) || 10,
      length: Number(product.length) || 10,
      weight: Number(product.weight) || 0.3,
      insurance_value: Number(product.price) || 0,
      quantity: Number(product.quantity) || 1,
    }));

    console.log("Dados preparados para Melhor Envio:", {
      from: fromData,
      to: toData,
      products: productsData,
    });

    // Verificar se temos token do Melhor Envio
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      console.log("Token do Melhor Envio não configurado, usando fallback");
      return getFallbackShipping();
    }

    // Calcular frete
    const response = await axios.post(
      `${MELHOR_ENVIO_API}/shipment/calculate`,
      {
        from: fromData,
        to: toData,
        products: productsData,
        services: "1,2,3,4", // Códigos dos serviços
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000, // 10 segundos de timeout
      }
    );

    console.log("Resposta do Melhor Envio:", response.data);

    // Validar resposta
    if (!response.data || !Array.isArray(response.data)) {
      console.log("Resposta inválida do Melhor Envio, usando fallback");
      return getFallbackShipping();
    }

    return NextResponse.json({
      success: true,
      services: response.data,
    });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    console.log("Usando frete fallback devido ao erro");

    return getFallbackShipping();
  }
}

function getFallbackShipping() {
  console.log("Retornando frete fallback");
  return NextResponse.json({
    success: true,
    services: [
      {
        id: 1,
        name: "PAC",
        company: "Correios",
        price: 15.0,
        delivery_time: 5,
        delivery_range: {
          min: 3,
          max: 7,
        },
        error: false,
      },
      {
        id: 2,
        name: "SEDEX",
        company: "Correios",
        price: 25.0,
        delivery_time: 2,
        delivery_range: {
          min: 1,
          max: 3,
        },
        error: false,
      },
    ],
  });
}
