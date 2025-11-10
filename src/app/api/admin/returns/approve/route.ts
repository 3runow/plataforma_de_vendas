import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação e se é admin
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Busca o usuário completo para verificar se é admin
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!fullUser || fullUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem aprovar devoluções.' },
        { status: 403 }
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }

    // Busca o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se o pedido está com status de devolução solicitada
    if (order.status !== 'return_requested') {
      return NextResponse.json(
        { error: 'Este pedido não está aguardando aprovação de devolução' },
        { status: 400 }
      );
    }

    // Atualiza o status do pedido para devolução aprovada
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'return_approved',
        updatedAt: new Date(),
      }
    });

    // TODO: Enviar email para o cliente informando que a devolução foi aprovada
    console.log(`✅ Devolução aprovada para o pedido #${orderId}`);
    console.log(`📧 Enviar email para: ${order.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Devolução aprovada com sucesso',
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Erro ao aprovar devolução:', error);
    return NextResponse.json(
      { error: 'Erro ao processar aprovação da devolução' },
      { status: 500 }
    );
  }
}
