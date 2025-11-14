import { NextRequest, NextResponse } from 'next/server';
import { getMelhorEnvioService } from '@/lib/melhor-envio';

interface GenerateLabelRequest {
  shipmentId: string; // ID do Melhor Envio
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateLabelRequest = await request.json();
    const { shipmentId } = body;

    if (!shipmentId) {
      return NextResponse.json(
        { error: 'ID do envio é obrigatório' },
        { status: 400 }
      );
    }

    const melhorEnvio = getMelhorEnvioService();

    // Gerar etiqueta
    await melhorEnvio.generateLabels([shipmentId]);

    // Obter URL de impressão
    const labelUrl = await melhorEnvio.printLabels([shipmentId], 'private');

    return NextResponse.json({
      success: true,
      labelUrl,
    });
  } catch (error: unknown) {
    console.error('Erro ao gerar etiqueta:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar etiqueta';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
