import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Resend } from 'resend';

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

/**
 * POST /api/shipping/reverse-logistics
 * Solicita logística reversa (devolução) através do Melhor Envio
 * 
 * Documentação Melhor Envio:
 * https://docs.melhorenvio.com.br/docs/reverse-logistics
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: true,
        address: true,
        shipment: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se o pedido foi entregue
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Apenas pedidos entregues podem ser devolvidos' },
        { status: 400 }
      );
    }

    const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
    const melhorEnvioBaseUrl =
      process.env.MELHOR_ENVIO_SANDBOX === 'true'
        ? 'https://sandbox.melhorenvio.com.br/api/v2'
        : 'https://melhorenvio.com.br/api/v2';

    if (!melhorEnvioToken) {
      return NextResponse.json(
        { error: 'Token do Melhor Envio não configurado' },
        { status: 500 }
      );
    }

    if (!order.address) {
      return NextResponse.json(
        { error: 'Endereço do pedido não encontrado' },
        { status: 400 }
      );
    }

    console.log('🔄 ========================================');
    console.log('🔄 INICIANDO LOGÍSTICA REVERSA');
    console.log('🔄 ========================================');
    console.log(`📦 Pedido #${orderId}`);

    // ETAPA 1: Calcular frete para logística reversa
    console.log('1️⃣ Calculando frete reverso...');

    const products = order.items.map((item) => ({
      id: String(item.product.id),
      width: 20, // Dimensão padrão
      height: 10,
      length: 30,
      weight: 0.3,
      insurance_value: item.product.price * item.quantity,
      quantity: item.quantity,
    }));

    // Na logística reversa, FROM é o endereço do cliente e TO é o depósito da empresa
    const quotePayload = {
      from: {
        postal_code: order.address.cep.replace(/\D/g, ''),
      },
      to: {
        postal_code: process.env.COMPANY_CEP?.replace(/\D/g, '') || '11045003',
      },
      products,
      options: {
        receipt: false,
        own_hand: false,
        reverse: true, // ATIVA LOGÍSTICA REVERSA
        insurance_value: products.reduce((sum, p) => sum + p.insurance_value, 0),
      },
    };

    console.log('📊 Payload de cotação:', JSON.stringify(quotePayload, null, 2));

    const quoteResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/shipment/calculate`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${melhorEnvioToken}`,
        },
        body: JSON.stringify(quotePayload),
      }
    );

    if (!quoteResponse.ok) {
      const error = await quoteResponse.text();
      console.error('❌ Erro na cotação:', error);
      return NextResponse.json(
        { error: 'Erro ao calcular frete de devolução', details: error },
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
      price: number | string;
      company: {
        name: string;
      };
    }

    const selectedQuote =
      quotes.find((q: Quote) => !q.error && q.name === 'PAC') ||
      quotes.find((q: Quote) => !q.error);

    if (!selectedQuote) {
      return NextResponse.json(
        { error: 'Nenhum serviço de frete disponível para devolução' },
        { status: 400 }
      );
    }

    console.log(`✅ Serviço selecionado: ${selectedQuote.name} - R$ ${selectedQuote.price}`);

    // ETAPA 2: Adicionar ao carrinho
    console.log('2️⃣ Adicionando ao carrinho...');

    const cartPayload = {
      service: selectedQuote.id,
      agency: null,
      from: {
        name: order.user.name,
        phone: order.user.phone?.replace(/\D/g, '') || '',
        email: order.user.email,
        document: order.user.cpf?.replace(/\D/g, '') || '',
        address: order.address.street,
        complement: order.address.complement || '',
        number: order.address.number,
        district: order.address.neighborhood,
        city: order.address.city,
        state_abbr: order.address.state,
        country_id: 'BR',
        postal_code: order.address.cep.replace(/\D/g, ''),
      },
      to: {
        name: process.env.COMPANY_NAME || 'Loja Bricks',
        phone: process.env.COMPANY_PHONE?.replace(/\D/g, '') || '11912345678',
        email: process.env.COMPANY_EMAIL || 'devguilhermeverrone@gmail.com',
        document: process.env.COMPANY_DOCUMENT?.replace(/\D/g, '') || '49100771899',
        address: process.env.COMPANY_ADDRESS || 'Av. Conselheiro Nebias',
        complement: process.env.COMPANY_COMPLEMENT || '',
        number: process.env.COMPANY_NUMBER || '669',
        district: process.env.COMPANY_DISTRICT || 'Boqueirão',
        city: process.env.COMPANY_CITY || 'Santos',
        state_abbr: process.env.COMPANY_STATE || 'SP',
        country_id: 'BR',
        postal_code: process.env.COMPANY_CEP?.replace(/\D/g, '') || '11045003',
      },
      products: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitary_value: item.product.price,
      })),
      volumes: [
        {
          height: products[0]?.height || 10,
          width: products[0]?.width || 20,
          length: products[0]?.length || 30,
          weight: products.reduce((sum, p) => sum + p.weight * p.quantity, 0),
        },
      ],
      options: {
        insurance_value: products.reduce((sum, p) => sum + p.insurance_value, 0),
        receipt: false,
        own_hand: false,
        reverse: true, // LOGÍSTICA REVERSA
        non_commercial: false,
      },
    };

    console.log('📋 Payload do carrinho:', JSON.stringify(cartPayload, null, 2));

    const cartResponse = await fetch(`${melhorEnvioBaseUrl}/me/cart`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${melhorEnvioToken}`,
      },
      body: JSON.stringify(cartPayload),
    });

    if (!cartResponse.ok) {
      const error = await cartResponse.text();
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao adicionar devolução ao carrinho', details: error },
        { status: 500 }
      );
    }

    const cartItem = await cartResponse.json();
    console.log('✅ Adicionado ao carrinho:', cartItem.id);

    // ETAPA 3: Fazer checkout
    console.log('3️⃣ Fazendo checkout...');

    const checkoutResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/shipment/checkout`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${melhorEnvioToken}`,
        },
        body: JSON.stringify({
          orders: [cartItem.id],
        }),
      }
    );

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      console.error('❌ Erro no checkout:', error);
      return NextResponse.json(
        { error: 'Erro ao fazer checkout da devolução', details: error },
        { status: 500 }
      );
    }

    const checkout = await checkoutResponse.json();
    console.log('✅ Checkout concluído:', checkout.purchase.protocol);

    // ETAPA 4: Gerar etiqueta
    console.log('4️⃣ Gerando etiqueta...');

    const generateResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/shipment/generate`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${melhorEnvioToken}`,
        },
        body: JSON.stringify({
          orders: [cartItem.id],
        }),
      }
    );

    if (!generateResponse.ok) {
      const error = await generateResponse.text();
      console.error('❌ Erro ao gerar etiqueta:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar etiqueta de devolução', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Etiqueta gerada');

    // ETAPA 5: Obter URL de impressão
    console.log('5️⃣ Obtendo URL de impressão...');

    const printResponse = await fetch(`${melhorEnvioBaseUrl}/me/shipment/print`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${melhorEnvioToken}`,
      },
      body: JSON.stringify({
        orders: [cartItem.id],
      }),
    });

    if (!printResponse.ok) {
      const error = await printResponse.text();
      console.error('❌ Erro ao obter URL de impressão:', error);
      return NextResponse.json(
        { error: 'Erro ao obter URL de impressão', details: error },
        { status: 500 }
      );
    }

    const printData = await printResponse.json();
    const labelUrl = printData.url;
    console.log('✅ URL da etiqueta:', labelUrl);

    if (!labelUrl) {
      return NextResponse.json(
        { error: 'A API do Melhor Envio não retornou a URL da etiqueta' },
        { status: 502 }
      );
    }

    // ETAPA 6: Buscar detalhes do envio
    console.log('6️⃣ Buscando detalhes do envio...');

    const shipmentDetailsResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/orders/${cartItem.id}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${melhorEnvioToken}`,
        },
      }
    );

    if (!shipmentDetailsResponse.ok) {
      const errorDetails = await shipmentDetailsResponse.text();
      console.error('❌ Erro ao consultar detalhes da devolução:', errorDetails);
    }

    const shipmentDetails = await shipmentDetailsResponse.json();
    const trackingCode = shipmentDetails?.tracking || cartItem.id;

    if (!resend) {
      return NextResponse.json(
        { error: 'Serviço de e-mail não configurado' },
        { status: 500 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'return_label_generated',
        melhorEnvioOrderId: cartItem.id,
        shippingTrackingCode: trackingCode,
        updatedAt: new Date(),
      },
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'logistica@plataforma.dev',
      to: order.user.email,
      subject: `Etiqueta de devolução - Pedido #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
          <h2>Olá, ${order.user.name || 'cliente'}!</h2>
          <p>Geramos sua etiqueta de logística reversa. Use o link abaixo para baixá-la:</p>
          <p>
            <a href="${labelUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
              Baixar etiqueta de devolução
            </a>
          </p>
          <p><strong>Código de rastreamento:</strong> ${trackingCode}</p>
          <p>Você pode acompanhar o progresso em ${appUrl}/rastreamento/${trackingCode}.</p>
          <p style="margin-top:16px;">
            1. Imprima a etiqueta e fixe na embalagem.<br/>
            2. Entregue o pacote na agência indicada.<br/>
            3. Guarde o comprovante com o código de rastreamento.
          </p>
        </div>
      `,
    });

    console.log('✅ ========================================');
    console.log('✅ LOGÍSTICA REVERSA CONCLUÍDA COM SUCESSO');
    console.log('✅ ========================================');

    return NextResponse.json({
      success: true,
      message: 'Etiqueta de devolução gerada com sucesso',
      orderId: order.id,
      reverseLogisticsId: cartItem.id,
      trackingCode,
      labelUrl,
      protocol: checkout.purchase.protocol,
    });
  } catch (error) {
    console.error('Erro na logística reversa', error);
    return NextResponse.json(
      { error: true, message: 'Erro logística reversa' },
      { status: 500 }
    );
  }
}
