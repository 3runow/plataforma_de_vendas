// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * EXEMPLO DE USO COMPLETO DA INTEGRAÇÃO DE ENVIO
 *
 * Este arquivo demonstra como usar todas as funcionalidades
 * de envio em um fluxo real de e-commerce.
 */

// ============================================
// 1. NO CHECKOUT - Calcular e Selecionar Frete
// ============================================

import { ShippingOptions } from "@/components/shipping-options";
import { useState } from "react";

export function CheckoutPage() {
  const [selectedShipping, setSelectedShipping] = useState<{
    id: number;
    name: string;
    discountedPrice: number;
  } | null>(null);
  const [address, setAddress] = useState({
    cep: "",
    // ... outros campos
  });
  const [cartItems, setCartItems] = useState([
    { id: 1, quantity: 2 },
    { id: 3, quantity: 1 },
  ]);

  const handleShippingSelect = (option: {
    id: number;
    name: string;
    discountedPrice: number;
  }) => {
    setSelectedShipping(option);
    console.log("Frete selecionado:", option);
    // Atualizar total do pedido com valor do frete
  };

  return (
    <div>
      {/* Formulário de endereço */}
      <input
        value={address.cep}
        onChange={(e) => setAddress({ ...address, cep: e.target.value })}
        placeholder="CEP"
      />

      {/* Opções de frete - aparecem automaticamente quando CEP válido */}
      {address.cep.length === 8 && (
        <ShippingOptions
          products={cartItems}
          toZipCode={address.cep}
          onSelectAction={handleShippingSelect}
        />
      )}

      {/* Resumo do pedido */}
      {selectedShipping && (
        <div>
          <p>Subtotal: R$ 100,00</p>
          <p>
            Frete ({selectedShipping.name}): R${" "}
            {selectedShipping.discountedPrice}
          </p>
          <p>Total: R$ {100 + selectedShipping.discountedPrice}</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// 2. AO FINALIZAR PEDIDO - Salvar Informações
// ============================================

// ============================================
// 2. CRIAR PEDIDO - Salvar dados do frete selecionado
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createOrder(orderData: any) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: orderData.userId,
      addressId: orderData.addressId,
      items: orderData.items,
      total: orderData.total,
      // Salvar dados do frete selecionado
      shippingService: orderData.selectedShipping.name,
      shippingPrice: orderData.selectedShipping.discountedPrice,
      shippingDeliveryTime: orderData.selectedShipping.deliveryTime,
      // Guardar serviceId para comprar depois
      shippingServiceId: orderData.selectedShipping.id,
    }),
  });

  return response.json();
}

// ============================================
// 3. APÓS CONFIRMAÇÃO DE PAGAMENTO - Comprar Frete
// ============================================

async function purchaseShippingForOrder(orderId, serviceId) {
  try {
    const response = await fetch("/api/shipping/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        serviceId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    console.log("Frete comprado com sucesso!");
    console.log("Protocolo:", data.shipment.protocol);
    console.log("Código de rastreio:", data.shipment.trackingCode);

    return data.shipment;
  } catch (error) {
    console.error("Erro ao comprar frete:", error);
    throw error;
  }
}

// Exemplo de uso após pagamento confirmado
async function handlePaymentConfirmed(orderId) {
  // Buscar dados do pedido
  const order = await fetch(`/api/orders/${orderId}`).then((r) => r.json());

  // Comprar frete automaticamente
  const shipment = await purchaseShippingForOrder(
    orderId,
    order.shippingServiceId
  );

  // Atualizar status do pedido
  await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "processing",
      trackingCode: shipment.trackingCode,
    }),
  });

  // Enviar email para o cliente com código de rastreio
  await sendTrackingEmail(order.userId, shipment.trackingCode);
}

// ============================================
// 4. NO PAINEL ADMIN - Gerar e Imprimir Etiquetas
// ============================================

async function generateAndPrintLabel(shipmentId) {
  try {
    const response = await fetch("/api/shipping/label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipmentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    // Abrir PDF em nova aba para impressão
    window.open(data.labelUrl, "_blank");

    console.log("Etiqueta gerada! URL:", data.labelUrl);
  } catch (error) {
    console.error("Erro ao gerar etiqueta:", error);
    alert("Erro ao gerar etiqueta: " + error.message);
  }
}

// Exemplo: Gerar etiquetas em lote
async function printMultipleLabels(orderIds) {
  for (const orderId of orderIds) {
    const order = await fetch(`/api/orders/${orderId}`).then((r) => r.json());

    if (order.shipment?.melhorEnvioId) {
      await generateAndPrintLabel(order.shipment.melhorEnvioId);

      // Aguardar 1 segundo entre cada requisição
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// ============================================
// 5. PÁGINA DE RASTREAMENTO - Mostrar Status
// ============================================

import { TrackingTimeline } from "@/components/tracking-timeline";

export function OrderTrackingPage({ orderId }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => setOrder(data));
  }, [orderId]);

  if (!order) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Pedido #{orderId}</h1>

      <div className="order-info">
        <p>Status: {order.status}</p>
        <p>Total: R$ {order.total}</p>
        <p>Frete: {order.shippingService}</p>
      </div>

      {/* Rastreamento automático */}
      {order.shippingTrackingCode && (
        <TrackingTimeline
          trackingCode={order.shippingTrackingCode}
          autoRefresh={true}
          refreshInterval={60} // Atualiza a cada 1 minuto
        />
      )}
    </div>
  );
}

// ============================================
// 6. WEBHOOK - Receber Atualizações Automáticas
// ============================================

// app/api/webhooks/melhor-envio/route.ts
export async function POST(request) {
  try {
    const event = await request.json();

    console.log("Webhook recebido:", event);

    // Verificar tipo de evento
    switch (event.type) {
      case "tracking.updated":
        await handleTrackingUpdate(event.data);
        break;

      case "order.posted":
        await handleOrderPosted(event.data);
        break;

      case "order.delivered":
        await handleOrderDelivered(event.data);
        break;

      case "order.canceled":
        await handleOrderCanceled(event.data);
        break;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleTrackingUpdate(data) {
  // Atualizar eventos de rastreamento no banco
  const shipment = await prisma.shipment.findFirst({
    where: { melhorEnvioId: data.order_id },
  });

  if (!shipment) return;

  // Limpar eventos antigos
  await prisma.trackingEvent.deleteMany({
    where: { shipmentId: shipment.id },
  });

  // Adicionar novos eventos
  if (data.tracking_events) {
    await prisma.trackingEvent.createMany({
      data: data.tracking_events.map((event) => ({
        shipmentId: shipment.id,
        status: event.status,
        message: event.description,
        location: event.location || null,
        date: new Date(event.occurred_at),
      })),
    });
  }
}

async function handleOrderDelivered(data) {
  // Marcar como entregue
  const shipment = await prisma.shipment.update({
    where: { melhorEnvioId: data.order_id },
    data: {
      delivered: true,
      deliveredAt: new Date(),
      status: "delivered",
    },
    include: { order: true },
  });

  // Atualizar status do pedido
  await prisma.order.update({
    where: { id: shipment.orderId },
    data: { status: "delivered" },
  });

  // Enviar email de confirmação de entrega
  await sendDeliveryConfirmationEmail(shipment.order.userId);
}

// ============================================
// 7. UTILITÁRIOS - Funções Auxiliares
// ============================================

// Calcular dimensões baseado nos produtos
function calculatePackageDimensions(products) {
  // Lógica simplificada - ajuste conforme seus produtos
  const totalVolume = products.reduce((sum, p) => {
    return sum + p.width * p.height * p.length * p.quantity;
  }, 0);

  // Estimar dimensões da caixa
  const cubeRoot = Math.cbrt(totalVolume);

  return {
    width: Math.ceil(cubeRoot * 1.2),
    height: Math.ceil(cubeRoot),
    length: Math.ceil(cubeRoot * 1.5),
  };
}

// Calcular peso total
function calculateTotalWeight(products) {
  return products.reduce((sum, p) => {
    return sum + p.weight * p.quantity;
  }, 0);
}

// Formatar CEP
function formatCep(cep) {
  const cleaned = cep.replace(/\D/g, "");
  return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// Validar CEP
function isValidCep(cep) {
  const cleaned = cep.replace(/\D/g, "");
  return /^\d{8}$/.test(cleaned);
}

// ============================================
// 8. TESTES - Exemplos de Testes
// ============================================

// Teste de cálculo de frete
async function testCalculateShipping() {
  const result = await fetch("/api/shipping/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      products: [{ id: 1, quantity: 1 }],
      toZipCode: "01310100",
    }),
  });

  const data = await result.json();
  console.log("Opções de frete:", data.options);
}

// Teste de rastreamento
async function testTracking() {
  const result = await fetch("/api/shipping/track/BR123456789BR");
  const data = await result.json();
  console.log("Rastreamento:", data.tracking);
}

// ============================================
// EXPORTAÇÕES
// ============================================

export {
  createOrder,
  purchaseShippingForOrder,
  generateAndPrintLabel,
  printMultipleLabels,
  handlePaymentConfirmed,
  calculatePackageDimensions,
  calculateTotalWeight,
  formatCep,
  isValidCep,
  testCalculateShipping,
  testTracking,
};
