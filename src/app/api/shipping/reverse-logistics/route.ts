import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

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

    // TODO: Integração com API do Melhor Envio
    // Por enquanto, apenas registramos a solicitação no banco
    
    // Atualizar status do pedido para indicar que há uma solicitação de devolução
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'return_requested', // Você pode adicionar esse status no schema
        updatedAt: new Date(),
      },
    });

    // TODO: Quando integrar com Melhor Envio, fazer:
    // 1. Criar etiqueta de logística reversa
    // 2. Gerar código de rastreamento
    // 3. Enviar email para o cliente com instruções
    /*
    const melhorEnvioToken = process.env.MELHOR_ENVIO_TOKEN;
    
    const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/reverse', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${melhorEnvioToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        service: order.shippingService,
        from: {
          name: order.address.recipientName,
          phone: order.user.phone,
          address: order.address.street,
          number: order.address.number,
          complement: order.address.complement || '',
          district: order.address.neighborhood,
          city: order.address.city,
          state_abbr: order.address.state,
          postal_code: order.address.cep,
        },
        to: {
          name: 'Sua Loja',
          phone: 'SEU_TELEFONE',
          address: 'Seu endereço',
          number: '123',
          district: 'Seu bairro',
          city: 'Sua cidade',
          state_abbr: 'SP',
          postal_code: 'SEU_CEP',
        },
        products: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitary_value: item.product.price,
        })),
      }),
    });

    const reverseData = await response.json();
    */

    return NextResponse.json({
      success: true,
      message: 'Solicitação de devolução registrada com sucesso',
      orderId: order.id,
      // reverseLogisticsId: reverseData.id, // Quando integrar com Melhor Envio
    });
  } catch (error) {
    console.error('Erro ao processar logística reversa:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de devolução' },
      { status: 500 }
    );
  }
}
