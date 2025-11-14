import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MelhorEnvioService } from "@/lib/melhor-envio";

/**
 * Endpoint de teste para simular a compra automática de frete
 * POST /api/test/auto-shipping
 * Body: { orderId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`\n🧪 ========================================`);
    console.log(`🧪 TESTE: Compra automática para pedido #${orderId}`);
    console.log(`🧪 ========================================\n`);

    // 1. Verificar configuração
    console.log("1️⃣ Verificando configuração...");
    const autoPurchaseEnabled =
      process.env.MELHOR_ENVIO_AUTO_PURCHASE === "true";
    console.log(
      `   MELHOR_ENVIO_AUTO_PURCHASE: ${process.env.MELHOR_ENVIO_AUTO_PURCHASE}`
    );
    console.log(`   Enabled: ${autoPurchaseEnabled}`);

    if (!autoPurchaseEnabled) {
      return NextResponse.json(
        {
          error: "Compra automática desativada",
          message: "Configure MELHOR_ENVIO_AUTO_PURCHASE=true no .env.local",
        },
        { status: 400 }
      );
    }

    // 2. Buscar pedido
    console.log("\n2️⃣ Buscando pedido...");
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

    if (!fullOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    console.log(`   ✅ Pedido encontrado`);
    console.log(`   Cliente: ${fullOrder.user.email}`);
    console.log(`   Status: ${fullOrder.status}`);
    console.log(`   Pagamento: ${fullOrder.paymentStatus}`);

    if (!fullOrder.address) {
      return NextResponse.json(
        { error: "Pedido sem endereço de entrega" },
        { status: 400 }
      );
    }

    // 3. Verificar se já tem frete
    console.log("\n3️⃣ Verificando frete existente...");
    const existingShipment = await prisma.shipment.findFirst({
      where: { orderId: fullOrder.id },
    });

    if (existingShipment) {
      console.log(`   ⚠️  Frete já foi comprado anteriormente`);
      console.log(`   Protocol: ${existingShipment.protocol}`);

      return NextResponse.json(
        {
          warning: "Frete já comprado",
          shipment: {
            protocol: existingShipment.protocol,
            service: existingShipment.serviceName,
            price: existingShipment.price,
            tracking: existingShipment.trackingCode,
          },
        },
        { status: 200 }
      );
    }

    console.log(`   ✅ Sem frete anterior, pode comprar`);

    // 4. Comprar frete
    console.log("\n4️⃣ Comprando frete automaticamente...");

    const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
    if (!melhorEnvioToken) {
      return NextResponse.json(
        { error: "MELHOR_ENVIO_TOKEN não configurado" },
        { status: 500 }
      );
    }

    const melhorEnvio = new MelhorEnvioService({
      token: melhorEnvioToken,
      sandbox: process.env.MELHOR_ENVIO_SANDBOX === "true",
    });

    const defaultServiceId = 1; // PAC

    const shippingResult = await melhorEnvio.purchaseShipping({
      serviceId: defaultServiceId,
      from: {
        postal_code:
          process.env.STORE_CEP || process.env.STORE_ZIP_CODE || "11045003",
      },
      to: {
        postal_code: fullOrder.address.cep,
        name: fullOrder.address.recipientName,
        phone: fullOrder.user.phone || "1140004000",
        email: fullOrder.user.email,
        document: fullOrder.user.cpf || "12345678909",
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

    console.log(`\n✅ Frete comprado com sucesso!`);
    console.log(`   Protocol: ${shippingResult.protocol}`);
    console.log(`   Tracking: ${shippingResult.trackingCode}`);
    console.log(`   Label: ${shippingResult.labelUrl}`);

    return NextResponse.json({
      success: true,
      message: "Frete comprado automaticamente",
      shipping: shippingResult,
    });
  } catch (error) {
    const err = error as Error & {
      response?: { data?: unknown };
      stack?: string;
    };
    console.error("\n❌ Erro ao testar compra automática:", error);
    return NextResponse.json(
      {
        error: "Erro ao comprar frete",
        message: err.message,
        details: err.response?.data || err.stack,
      },
      { status: 500 }
    );
  }
}
