import { NextRequest, NextResponse } from 'next/server';
import { getMelhorEnvioService } from '@/lib/melhor-envio';
import { prisma } from '@/lib/prisma';

interface PurchaseShippingRequest {
  orderId: number;
  serviceId: number;
  volumeId?: number;
}

export async function POST(request: NextRequest) {
  let requestBody: PurchaseShippingRequest | null = null;
  
  try {
    requestBody = await request.json();
    const { orderId, serviceId, volumeId } = requestBody;

    // Buscar pedido
    const order = await prisma.order.findUnique({
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

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe envio
    const existingShipment = await prisma.shipment.findUnique({
      where: { orderId },
    });

    if (existingShipment) {
      return NextResponse.json(
        { error: 'Envio já foi criado para este pedido' },
        { status: 400 }
      );
    }

    const melhorEnvio = getMelhorEnvioService();

    // CEP da loja
    const storeZipCode = process.env.STORE_ZIP_CODE || '01310100';

    // Calcular valor total para seguro
    const totalValue = order.items.reduce((acc, item) => {
      return acc + (item.price * item.quantity);
    }, 0);

    // Preparar produtos no formato da API Melhor Envio
    const products = order.items.map((item) => ({
      id: item.product.id.toString(),
      width: 20, // largura padrão em cm
      height: 10, // altura padrão em cm
      length: 30, // comprimento padrão em cm
      weight: 0.3, // peso padrão em kg
      insurance_value: item.price,
      quantity: item.quantity,
    }));

    // Preparar dados para compra de frete (formato API Melhor Envio)
    const shippingData = {
      serviceId,
      from: {
        postal_code: storeZipCode.replace(/\D/g, ''),
        name: process.env.STORE_NAME || 'Loja',
        phone: process.env.STORE_PHONE || '1140004000',
        email: process.env.STORE_EMAIL || 'contato@loja.com',
        document: process.env.STORE_CNPJ || '00000000000000',
        address: process.env.STORE_ADDRESS || 'Endereço',
        number: process.env.STORE_NUMBER || '100',
        district: process.env.STORE_DISTRICT || 'Centro',
        city: process.env.STORE_CITY || 'São Paulo',
        state_abbr: process.env.STORE_STATE || 'SP',
      },
      to: {
        postal_code: order.address.cep.replace(/\D/g, ''),
        name: order.address.recipientName,
        phone: order.user.phone || '1140004000',
        email: order.user.email,
        document: order.user.cpf?.replace(/\D/g, '') || '00000000000',
        address: order.address.street,
        number: order.address.number,
        district: order.address.neighborhood,
        city: order.address.city,
        state_abbr: order.address.state,
      },
      products,
      options: {
        receipt: false,
        own_hand: false,
        insurance_value: totalValue,
      },
    };

    // Executar fluxo completo de compra
    const result = await melhorEnvio.purchaseShipping(shippingData);

    // Salvar shipment no banco
    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        melhorEnvioId: result.orderId,
        protocol: result.protocol,
        serviceId,
        trackingCode: result.trackingCode,
        labelUrl: result.labelUrl,
        status: 'pending',
        paid: true,
        paidAt: new Date(),
      },
    });

    // Atualizar order
    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingTrackingCode: result.trackingCode,
        status: 'processing',
      },
    });

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        protocol: shipment.protocol,
        trackingCode: shipment.trackingCode,
        labelUrl: shipment.labelUrl,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro detalhado ao comprar frete:', {
      message: error.message,
      stack: error.stack,
      request: requestBody,
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao comprar frete',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
