import { NextRequest, NextResponse } from 'next/server';
import { getMelhorEnvioService } from '@/lib/melhor-envio';
import { prisma } from '@/lib/prisma';

interface TrackParams {
  params: {
    code: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: TrackParams
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'Código de rastreio é obrigatório' },
        { status: 400 }
      );
    }

    const melhorEnvio = getMelhorEnvioService();

    // Buscar rastreamento no Melhor Envio
    const tracking = await melhorEnvio.trackShipment(code);

    // Atualizar eventos de rastreamento no banco (se tiver o modelo Shipment)
    // Comentado até rodar a migração
    /*
    const shipment = await prisma.shipment.findFirst({
      where: { trackingCode: code },
    });

    if (shipment && tracking.tracking_events) {
      // Limpar eventos antigos
      await prisma.trackingEvent.deleteMany({
        where: { shipmentId: shipment.id },
      });

      // Adicionar novos eventos
      await prisma.trackingEvent.createMany({
        data: tracking.tracking_events.map((event) => ({
          shipmentId: shipment.id,
          status: event.status,
          message: event.description,
          location: event.location || null,
          date: new Date(event.occurred_at),
        })),
      });
    }
    */

    return NextResponse.json({
      success: true,
      tracking: {
        code: tracking.tracking,
        status: tracking.status,
        protocol: tracking.protocol,
        createdAt: tracking.created_at,
        paidAt: tracking.paid_at,
        postedAt: tracking.posted_at,
        deliveredAt: tracking.delivered_at,
        canceledAt: tracking.canceled_at,
        events: tracking.tracking_events || [],
      },
    });
  } catch (error: unknown) {
    console.error('Erro ao rastrear envio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao rastrear envio';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
