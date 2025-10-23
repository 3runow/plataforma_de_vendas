import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Webhook do Mercado Pago para receber notificações de pagamento
 * Configure em: https://www.mercadopago.com.br/developers/panel/notifications
 *
 * URL do webhook: https://seu-dominio.com/api/webhooks/mercadopago
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verificar se é uma notificação de pagamento
    if (body.type === "payment") {
      const paymentId = body.data.id;

      // Buscar informações do pagamento no Mercado Pago
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      );

      const paymentData = await response.json();

      // Buscar o pedido pelo metadata
      const orderId = paymentData.metadata?.order_id;

      if (!orderId) {
        return NextResponse.json(
          { error: "Order ID not found in payment metadata" },
          { status: 400 }
        );
      }

      // Atualizar o status do pedido
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: {
          paymentStatus: paymentData.status,
          status: getOrderStatus(paymentData.status),
        },
      });

      console.log(
        `Pedido #${orderId} atualizado. Status: ${paymentData.status}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no webhook do Mercado Pago:", errorMessage);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Mapeia o status do pagamento do Mercado Pago para o status do pedido
 */
function getOrderStatus(paymentStatus: string): string {
  const statusMap: Record<string, string> = {
    approved: "processing",
    pending: "pending",
    in_process: "pending",
    rejected: "cancelled",
    cancelled: "cancelled",
    refunded: "cancelled",
    charged_back: "cancelled",
  };

  return statusMap[paymentStatus] || "pending";
}
