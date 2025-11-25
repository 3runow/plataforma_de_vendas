import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/order/[id]/return-label
 * Cliente obtém o link da etiqueta de devolução após aprovação do admin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'ID do pedido inválido' }, { status: 400 });
    }

    // Buscar o pedido com informações de envio
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shipment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se a etiqueta foi gerada
    if (order.status !== 'return_label_generated') {
      return NextResponse.json(
        { 
          error: 'Etiqueta ainda não disponível',
          status: order.status,
          message: order.status === 'return_requested' 
            ? 'Aguardando aprovação do administrador'
            : order.status === 'return_approved'
            ? 'Aprovado! Aguardando geração da etiqueta'
            : 'Status do pedido não permite download da etiqueta'
        },
        { status: 400 }
      );
    }

    // Buscar shipment (pode haver múltiplos, pegar o mais recente)
    const returnShipment = await prisma.shipment.findFirst({
      where: {
        orderId: order.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!returnShipment || !returnShipment.labelUrl) {
      return NextResponse.json(
        { error: 'Etiqueta não encontrada. Entre em contato com o suporte.' },
        { status: 404 }
      );
    }

    // Se o cliente quiser baixar o PDF direto, fazemos o proxy
    const downloadParam = request.nextUrl.searchParams.get('download');
    
    if (downloadParam === 'true' && returnShipment.labelUrl) {
      try {
        console.log('📥 Baixando PDF da etiqueta do Melhor Envio...');
        
        // Buscar o PDF do Melhor Envio
        const pdfResponse = await fetch(returnShipment.labelUrl);
        
        if (!pdfResponse.ok) {
          throw new Error('Erro ao baixar PDF do Melhor Envio');
        }
        
        const pdfBuffer = await pdfResponse.arrayBuffer();
        
        console.log(`✅ PDF baixado: ${pdfBuffer.byteLength} bytes`);
        
        // Retornar o PDF direto para o cliente
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="etiqueta-devolucao-pedido-${order.id}.pdf"`,
            'Content-Length': pdfBuffer.byteLength.toString(),
          },
        });
      } catch (pdfError) {
        console.error('❌ Erro ao baixar PDF:', pdfError);
        // Se falhar, retorna o JSON normal com a URL
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      labelUrl: returnShipment.labelUrl,
      trackingCode: returnShipment.trackingCode || order.shippingTrackingCode,
      protocol: returnShipment.protocol,
      carrier: returnShipment.carrier,
      serviceName: returnShipment.serviceName,
      instructions: [
        '1. Baixe e imprima a etiqueta',
        '2. Cole a etiqueta na embalagem do produto',
        '3. Leve o pacote à agência dos Correios ou da transportadora',
        '4. Guarde o comprovante de postagem',
        '5. Acompanhe o rastreamento pela plataforma'
      ]
    });
  } catch (error) {
    console.error('Erro ao buscar etiqueta de devolução:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
