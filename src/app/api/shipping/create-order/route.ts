import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

const MELHOR_ENVIO_API =
  process.env.MELHOR_ENVIO_SANDBOX === "true"
    ? "https://sandbox.melhorenvio.com.br/api/v2/me"
    : "https://melhorenvio.com.br/api/v2/me";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    console.log("Criando pedido no Melhor Envio para orderId:", orderId);

    // Buscar o pedido
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

    // Preparar dados para o Melhor Envio
    const shippingData = {
      service: order.shippingService || "1",
      from: {
        name: "BRICKS",
        phone: "11999999999",
        email: "contato@bricks.com.br",
        document: "12345678000199",
        company_document: "12345678000199",
        state_register: "123456789",
        address: "Rua das Flores, 123",
        complement: "",
        number: "123",
        district: "Centro",
        city: "São Paulo",
        country_id: "BR",
        postal_code: "01234567",
        note: "Loja BRICKS",
      },
      to: {
        name: order.address.recipientName,
        phone: order.user.phone || "11999999999",
        email: order.user.email,
        document: order.user.cpf || "00000000000",
        address: order.address.street,
        complement: order.address.complement || "",
        number: order.address.number,
        district: order.address.neighborhood,
        city: order.address.city,
        state_abbr: order.address.state,
        country_id: "BR",
        postal_code: order.address.cep,
      },
      products: order.items.map((item: { product: { name: string; price: number }; quantity: number }) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitary_value: item.product.price,
      })),
      volumes: [
        {
          height: 10,
          width: 10,
          length: 10,
          weight:
            0.3 * order.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
        },
      ],
    };

    console.log("Dados do frete:", shippingData);

    // Criar pedido no Melhor Envio
    const response = await axios.post(
      `${MELHOR_ENVIO_API}/shipment`,
      shippingData,
      {
        headers: {
          Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("Resposta do Melhor Envio:", response.data);

    // Atualizar pedido com dados do frete
    await prisma.order.update({
      where: { id: orderId },
      data: {
        melhorEnvioOrderId: response.data.id?.toString(),
        shippingTrackingCode: response.data.tracking,
        status: "shipped",
      },
    });

    return NextResponse.json({
      success: true,
      shipping: {
        id: response.data.id,
        tracking: response.data.tracking,
        status: response.data.status,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pedido no Melhor Envio:", error);

    // Se falhar, apenas atualizar status
    try {
      const body = await request.json();
      await prisma.order.update({
        where: { id: body.orderId },
        data: {
          status: "processing",
        },
      });
    } catch (updateError) {
      console.error("Erro ao atualizar status do pedido:", updateError);
    }

    return NextResponse.json(
      {
        error: "Erro ao criar pedido no Melhor Envio",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
