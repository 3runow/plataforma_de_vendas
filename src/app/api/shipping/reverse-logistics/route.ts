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

    const serviceId = order.shipment?.serviceId;
    if (!serviceId) {
      return NextResponse.json(
        { error: 'Informações de envio não disponíveis para este pedido' },
        { status: 400 }
      );
    }

    const reverseResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/shipment/reverse`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!reverseResponse.ok) {
      let errorDetails: unknown;
      try {
        errorDetails = await reverseResponse.json();
      } catch {
        errorDetails = await reverseResponse.text();
      }

      console.error('Erro na logística reversa do Melhor Envio:', errorDetails);
      return NextResponse.json(
        {
          error: 'Não foi possível solicitar a logística reversa no Melhor Envio',
          details: errorDetails,
        },
        { status: reverseResponse.status === 400 ? 400 : 502 }
      );
    }

    const reverseData = await reverseResponse.json();

    const reverseOrderIdRaw =
      reverseData?.id ??
      reverseData?.order_id ??
      reverseData?.order?.id ??
      (Array.isArray(reverseData?.orders)
        ? reverseData.orders[0]?.id
        : undefined) ??
      reverseData?.data?.id;

    const reverseOrderId = reverseOrderIdRaw
      ? String(reverseOrderIdRaw)
      : null;

    if (!reverseOrderId) {
      return NextResponse.json(
        {
          error: 'Melhor Envio não retornou o identificador da logística reversa',
          details: reverseData,
        },
        { status: 502 }
      );
    }

    const generateResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/shipment/generate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: [reverseOrderId] }),
      }
    );

    if (!generateResponse.ok) {
      const errorDetails = await generateResponse.text();
      console.error('Erro ao gerar etiqueta de devolução:', errorDetails);
      return NextResponse.json(
        { error: 'Erro ao gerar etiqueta de devolução', details: errorDetails },
        { status: 502 }
      );
    }

    const printResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/shipment/print`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: [reverseOrderId] }),
      }
    );

    if (!printResponse.ok) {
      const errorDetails = await printResponse.text();
      console.error('Erro ao obter etiqueta de devolução:', errorDetails);
      return NextResponse.json(
        {
          error: 'Erro ao recuperar a etiqueta de devolução',
          details: errorDetails,
        },
        { status: 502 }
      );
    }

    const printData = await printResponse.json();
    const labelUrl =
      (printData && typeof printData === 'object' && 'url' in printData
        ? (printData as { url?: string }).url
        : Array.isArray(printData) && printData[0]?.url) || null;

    if (!labelUrl) {
      return NextResponse.json(
        { error: 'A API do Melhor Envio não retornou a URL da etiqueta' },
        { status: 502 }
      );
    }

    const shipmentDetailsResponse = await fetch(
      `${melhorEnvioBaseUrl}/me/orders/${reverseOrderId}`,
      {
        headers: {
          Authorization: `Bearer ${melhorEnvioToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!shipmentDetailsResponse.ok) {
      const errorDetails = await shipmentDetailsResponse.text();
      console.error('Erro ao consultar detalhes da devolução:', errorDetails);
      return NextResponse.json(
        {
          error: 'Erro ao consultar rastreamento da devolução',
          details: errorDetails,
        },
        { status: 502 }
      );
    }

    const shipmentDetails = await shipmentDetailsResponse.json();

    const trackingCode =
      reverseData?.tracking ||
      reverseData?.tracking_code ||
      reverseData?.order?.tracking ||
      shipmentDetails?.tracking ||
      shipmentDetails?.melhorenvio_tracking ||
      shipmentDetails?.protocol ||
      reverseOrderId;

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
        melhorEnvioOrderId: reverseOrderId,
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

    return NextResponse.json({
      success: true,
      message: 'Etiqueta de devolução gerada com sucesso',
      orderId: order.id,
      reverseLogisticsId: reverseOrderId,
      trackingCode,
      labelUrl,
      protocol: shipmentDetails?.protocol,
    });
  } catch (error) {
    console.error('Erro na logística reversa', error);
    return NextResponse.json(
      { error: true, message: 'Erro logística reversa' },
      { status: 500 }
    );
  }
}
