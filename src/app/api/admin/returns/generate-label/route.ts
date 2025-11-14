import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação e se é admin
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca o usuário completo para verificar se é admin
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser || fullUser.role !== "admin") {
      return NextResponse.json(
        {
          error: "Acesso negado. Apenas administradores podem gerar etiquetas.",
        },
        { status: 403 }
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "ID do pedido é obrigatório" },
        { status: 400 }
      );
    }

    // Busca o pedido completo
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            cpf: true,
            phone: true,
          },
        },
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

    // Verifica se o pedido está com status de devolução aprovada
    if (order.status !== "return_approved") {
      return NextResponse.json(
        {
          error:
            "Este pedido precisa estar aprovado para gerar etiqueta de devolução",
        },
        { status: 400 }
      );
    }

    if (!order.address) {
      return NextResponse.json(
        { error: "Endereço não encontrado para este pedido" },
        { status: 400 }
      );
    }

    // Token da API do Melhor Envio
    const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;
    const MELHOR_ENVIO_URL =
      process.env.MELHOR_ENVIO_SANDBOX === "true"
        ? "https://sandbox.melhorenvio.com.br/api/v2"
        : "https://melhorenvio.com.br/api/v2";

    if (!MELHOR_ENVIO_TOKEN) {
      return NextResponse.json(
        { error: "Token do Melhor Envio não configurado" },
        { status: 500 }
      );
    }

    console.log("🔄 ========================================");
    console.log("🔄 GERANDO ETIQUETA DE DEVOLUÇÃO");
    console.log("🔄 ========================================");
    console.log(`📦 Pedido #${orderId}`);

    // ETAPA 1: Calcular frete para logística reversa
    console.log("1️⃣ Calculando frete reverso...");

    // Preparar produtos para cotação
    const products = order.items.map((item) => ({
      id: String(item.product.id),
      width: 20, // Dimensões padrão ou pegar do produto
      height: 10,
      length: 30,
      weight: 0.3,
      insurance_value: item.product.price * item.quantity,
      quantity: item.quantity,
    }));

    // IMPORTANTE: Na logística reversa, FROM é o endereço do cliente e TO é seu depósito
    const quotePayload = {
      from: {
        postal_code: order.address.cep.replace(/\D/g, ""),
      },
      to: {
        postal_code: process.env.COMPANY_CEP?.replace(/\D/g, "") || "11045003", // CEP da empresa
      },
      products,
      options: {
        receipt: false,
        own_hand: false,
        reverse: true, // ATIVA LOGÍSTICA REVERSA
        insurance_value: products.reduce(
          (sum, p) => sum + p.insurance_value,
          0
        ),
      },
    };

    console.log(
      "📊 Payload de cotação:",
      JSON.stringify(quotePayload, null, 2)
    );

    const quoteResponse = await fetch(
      `${MELHOR_ENVIO_URL}/me/shipment/calculate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        },
        body: JSON.stringify(quotePayload),
      }
    );

    if (!quoteResponse.ok) {
      const error = await quoteResponse.text();
      console.error("❌ Erro na cotação:", error);
      return NextResponse.json(
        { error: "Erro ao calcular frete de devolução", details: error },
        { status: 500 }
      );
    }

    const quotes = await quoteResponse.json();
    console.log(`✅ ${quotes.length} cotações retornadas`);

    // Buscar o serviço PAC ou o primeiro disponível
    interface Quote {
      error?: string;
      name: string;
      id: number;
      price: number;
      delivery_time: number;
    }

    const selectedQuote =
      quotes.find((q: Quote) => !q.error && q.name === "PAC") ||
      quotes.find((q: Quote) => !q.error);

    if (!selectedQuote) {
      return NextResponse.json(
        { error: "Nenhum serviço de frete disponível para devolução" },
        { status: 400 }
      );
    }

    console.log(
      `✅ Serviço selecionado: ${selectedQuote.name} - R$ ${selectedQuote.price}`
    );

    // ETAPA 2: Adicionar ao carrinho
    console.log("2️⃣ Adicionando ao carrinho...");

    const cartPayload = {
      service: selectedQuote.id,
      agency: null,
      from: {
        name: order.user.name,
        phone: order.user.phone?.replace(/\D/g, "") || "",
        email: order.user.email,
        document: order.user.cpf?.replace(/\D/g, "") || "",
        address: order.address.street,
        complement: order.address.complement || "",
        number: order.address.number,
        district: order.address.neighborhood,
        city: order.address.city,
        state_abbr: order.address.state,
        country_id: "BR",
        postal_code: order.address.cep.replace(/\D/g, ""),
      },
      to: {
        name: process.env.COMPANY_NAME || "Loja Bricks",
        phone: process.env.COMPANY_PHONE?.replace(/\D/g, "") || "11912345678",
        email: process.env.COMPANY_EMAIL || "devguilhermeverrone@gmail.com",
        document:
          process.env.COMPANY_DOCUMENT?.replace(/\D/g, "") || "49100771899",
        address: process.env.COMPANY_ADDRESS || "Av. Conselheiro Nebias",
        complement: process.env.COMPANY_COMPLEMENT || "",
        number: process.env.COMPANY_NUMBER || "669",
        district: process.env.COMPANY_DISTRICT || "Boqueirão",
        city: process.env.COMPANY_CITY || "Santos",
        state_abbr: process.env.COMPANY_STATE || "SP",
        country_id: "BR",
        postal_code: process.env.COMPANY_CEP?.replace(/\D/g, "") || "11045003",
      },
      products: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitary_value: item.product.price,
      })),
      volumes: [
        {
          height: 10,
          width: 20,
          length: 30,
          weight: products.reduce((sum, p) => sum + p.weight * p.quantity, 0),
        },
      ],
      options: {
        insurance_value: products.reduce(
          (sum, p) => sum + p.insurance_value,
          0
        ),
        receipt: false,
        own_hand: false,
        reverse: true, // LOGÍSTICA REVERSA
        non_commercial: false,
      },
    };

    console.log(
      "📋 Payload do carrinho:",
      JSON.stringify(cartPayload, null, 2)
    );

    const cartResponse = await fetch(`${MELHOR_ENVIO_URL}/me/cart`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
      },
      body: JSON.stringify(cartPayload),
    });

    if (!cartResponse.ok) {
      const error = await cartResponse.text();
      console.error("❌ Erro ao adicionar ao carrinho:", error);
      return NextResponse.json(
        { error: "Erro ao adicionar devolução ao carrinho", details: error },
        { status: 500 }
      );
    }

    const cartItem = await cartResponse.json();
    console.log("✅ Adicionado ao carrinho:", cartItem.id);

    // ETAPA 3: Fazer checkout
    console.log("3️⃣ Fazendo checkout...");

    const checkoutResponse = await fetch(
      `${MELHOR_ENVIO_URL}/me/shipment/checkout`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        },
        body: JSON.stringify({
          orders: [cartItem.id],
        }),
      }
    );

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      console.error("❌ Erro no checkout:", error);
      return NextResponse.json(
        { error: "Erro ao fazer checkout da devolução", details: error },
        { status: 500 }
      );
    }

    const checkout = await checkoutResponse.json();
    console.log("✅ Checkout concluído:", checkout.purchase.protocol);

    // ETAPA 4: Gerar etiqueta
    console.log("4️⃣ Gerando etiqueta...");

    const generateResponse = await fetch(
      `${MELHOR_ENVIO_URL}/me/shipment/generate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        },
        body: JSON.stringify({
          orders: [cartItem.id],
        }),
      }
    );

    if (!generateResponse.ok) {
      const error = await generateResponse.text();
      console.error("❌ Erro ao gerar etiqueta:", error);
      return NextResponse.json(
        { error: "Erro ao gerar etiqueta de devolução", details: error },
        { status: 500 }
      );
    }

    console.log("✅ Etiqueta gerada");

    // ETAPA 5: Obter URL de impressão
    console.log("5️⃣ Obtendo URL de impressão...");

    const printResponse = await fetch(`${MELHOR_ENVIO_URL}/me/shipment/print`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
      },
      body: JSON.stringify({
        orders: [cartItem.id],
      }),
    });

    if (!printResponse.ok) {
      const error = await printResponse.text();
      console.error("❌ Erro ao obter URL de impressão:", error);
    }

    const printData = await printResponse.json();
    const labelUrl = printData.url;
    console.log("✅ URL da etiqueta:", labelUrl);

    // ETAPA 6: Buscar detalhes do envio
    const shipmentDetailsResponse = await fetch(
      `${MELHOR_ENVIO_URL}/me/orders/${cartItem.id}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        },
      }
    );

    const shipmentDetails = await shipmentDetailsResponse.json();

    // Salvar no banco de dados
    const reverseShipment = await prisma.shipment.create({
      data: {
        orderId: order.id,
        melhorEnvioId: cartItem.id,
        protocol: checkout.purchase.protocol,
        serviceId: selectedQuote.id,
        serviceName: selectedQuote.name,
        carrier: selectedQuote.company.name,
        price: selectedQuote.price,
        discount: selectedQuote.discount || 0,
        finalPrice: selectedQuote.price - (selectedQuote.discount || 0),
        deliveryTime: selectedQuote.delivery_range.max, // Usando o máximo de dias
        trackingCode: shipmentDetails.tracking || null,
        status: "pending",
        labelUrl: labelUrl,
        paid: false,
        posted: false,
        delivered: false,
        canceled: false,
      },
    });

    // Atualizar pedido
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "return_label_generated",
        shippingTrackingCode: shipmentDetails.tracking || null,
        updatedAt: new Date(),
      },
    });

    console.log("✅ ========================================");
    console.log("✅ ETIQUETA DE DEVOLUÇÃO GERADA COM SUCESSO");
    console.log("✅ ========================================");

    // TODO: Enviar email ao cliente com a etiqueta e instruções

    return NextResponse.json({
      success: true,
      message: "Etiqueta de devolução gerada com sucesso",
      shipment: reverseShipment,
      labelUrl,
      trackingCode: shipmentDetails.tracking,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar etiqueta de devolução:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar geração de etiqueta",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
