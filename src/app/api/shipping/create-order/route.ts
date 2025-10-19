import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

const MELHOR_ENVIO_API =
  process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br/api/v2/me"
    : "https://melhorenvio.com.br/api/v2/me";

/**
 * Cria um pedido de frete no Melhor Envio após a aprovação do pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    // Buscar o pedido com todos os dados necessários
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (order.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Verificar se o pagamento foi aprovado
    if (order.paymentStatus !== "approved") {
      return NextResponse.json(
        { error: "Pagamento não aprovado" },
        { status: 400 }
      );
    }

    // Preparar dados do pedido de frete
    const shippingData = {
      service: order.shippingService || "", // ID do serviço escolhido
      from: {
        name: "Sua Loja",
        phone: "11999999999",
        email: "loja@example.com",
        document: "12345678000100", // CNPJ
        address: "Rua Exemplo",
        complement: "",
        number: "123",
        district: "Centro",
        city: "São Paulo",
        state_abbr: "SP",
        country_id: "BR",
        postal_code: "01310100", // CEP de origem
      },
      to: {
        name: order.address.recipientName,
        phone: order.user.phone || "11999999999",
        email: order.user.email,
        document: order.user.cpf || "",
        address: order.address.street,
        complement: order.address.complement || "",
        number: order.address.number,
        district: order.address.neighborhood,
        city: order.address.city,
        state_abbr: order.address.state,
        country_id: "BR",
        postal_code: order.address.cep.replace(/\D/g, ""),
      },
      products: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitary_value: item.product.price,
      })),
      volumes: [
        {
          height: 17,
          width: 11,
          length: 11,
          weight: 0.3,
        },
      ],
      options: {
        insurance_value: order.total,
        receipt: false,
        own_hand: false,
      },
    };

    // Criar o pedido no Melhor Envio
    const response = await axios.post(
      `${MELHOR_ENVIO_API}/cart`,
      shippingData,
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const melhorEnvioOrderId = response.data.id;

    // Comprar o frete (em produção, você deve verificar o saldo antes)
    await axios.post(
      `${MELHOR_ENVIO_API}/shipment/checkout`,
      {
        orders: [melhorEnvioOrderId],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Gerar etiqueta
    await axios.post(
      `${MELHOR_ENVIO_API}/shipment/generate`,
      {
        orders: [melhorEnvioOrderId],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Buscar informações de rastreio
    const trackingResponse = await axios.get(
      `${MELHOR_ENVIO_API}/shipment/tracking`,
      {
        params: {
          orders: melhorEnvioOrderId,
        },
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          Accept: "application/json",
        },
      }
    );

    const trackingCode = trackingResponse.data[0]?.tracking || "";

    // Atualizar o pedido com as informações de rastreio
    await prisma.order.update({
      where: { id: orderId },
      data: {
        melhorEnvioOrderId: melhorEnvioOrderId,
        shippingTrackingCode: trackingCode,
        status: "processing",
      },
    });

    return NextResponse.json({
      success: true,
      melhorEnvioOrderId,
      trackingCode,
    });
  } catch (error: any) {
    console.error(
      "Erro ao criar pedido de frete:",
      error.response?.data || error.message
    );

    return NextResponse.json(
      {
        error: "Erro ao criar pedido de frete",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
