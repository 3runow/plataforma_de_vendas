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
        { error: 'Acesso negado. Apenas administradores podem rejeitar devoluções.' },
        { status: 403 }
      );
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Motivo da rejeição é obrigatório' },
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

    // Verifica se o pedido está com status de devolução solicitada ou aprovada
    if (order.status !== 'return_requested' && order.status !== 'return_approved') {
      return NextResponse.json(
        { error: 'Este pedido não pode ser rejeitado no status atual' },
        { status: 400 }
      );
    }

    // Atualiza o status do pedido para devolução rejeitada
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'return_rejected',
        updatedAt: new Date(),
      }
    });

    // TODO: Salvar o motivo da rejeição em uma tabela de histórico
    // TODO: Enviar email para o cliente informando a rejeição e o motivo
    console.log(`❌ Devolução rejeitada para o pedido #${orderId}`);
    console.log(`📝 Motivo: ${reason}`);
    console.log(`📧 Enviar email para: ${order.user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Devolução rejeitada',
      reason,
      order: updatedOrder,
    });

  } catch (error) {
    console.error('Erro ao rejeitar devolução:', error);
    return NextResponse.json(
      { error: 'Erro ao processar rejeição da devolução' },
      { status: 500 }
    );
  }
}
