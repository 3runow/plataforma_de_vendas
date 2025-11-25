import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { Resend } from 'resend';

const resend =
  process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

/**
 * POST /api/order/request-return
 * Cliente solicita devolução de um pedido entregue
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'ID do pedido é obrigatório' }, { status: 400 });
    }

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        user: true,
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

    // Atualizar o pedido para status de devolução solicitada
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'return_requested',
        updatedAt: new Date(),
      },
    });

    // Enviar email para o admin notificando sobre a solicitação
    const adminEmail = process.env.ADMIN_EMAIL || 'devguilhermeverrone@gmail.com';
    
    if (resend) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@plataforma.dev',
        to: adminEmail,
        subject: `🔔 Nova solicitação de devolução - Pedido #${order.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
            <h2>Nova Solicitação de Devolução</h2>
            <p><strong>Pedido:</strong> #${order.id}</p>
            <p><strong>Cliente:</strong> ${order.user.name} (${order.user.email})</p>
            <p><strong>Valor total:</strong> R$ ${order.total.toFixed(2)}</p>
            <p><strong>Motivo:</strong> ${reason || 'Não informado'}</p>
            
            <h3>Produtos:</h3>
            <ul>
              ${order.items.map(item => `
                <li>${item.product.name} - Quantidade: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}</li>
              `).join('')}
            </ul>
            
            <p style="margin-top: 24px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/returns" 
                 style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">
                Ver no painel administrativo
              </a>
            </p>
          </div>
        `,
      });
    }

    console.log(`✅ Solicitação de devolução criada para o pedido #${order.id}`);

    return NextResponse.json({
      success: true,
      message: 'Solicitação de devolução enviada com sucesso. Aguarde a aprovação do administrador.',
      orderId: order.id,
      status: 'return_requested',
    });
  } catch (error) {
    console.error('Erro ao solicitar devolução:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de devolução' },
      { status: 500 }
    );
  }
}
