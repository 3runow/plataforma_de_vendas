export type OrderStatus =
  | "payment_pending"
  | "payment_incomplete"
  | "abandoned_cart"
  | "abandoned_sale"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_approved"
  | "return_label_generated"
  | "return_in_transit"
  | "return_received"
  | "return_rejected";

export type OrderStatusCategory =
  | "payment"
  | "exception"
  | "logistics"
  | "return";

export interface OrderStatusMeta {
  value: OrderStatus;
  label: string;
  badgeClass: string;
  dotClass: string;
  chartColor: string;
  category: OrderStatusCategory;
  description?: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  payment_pending: {
    value: "payment_pending",
    label: "Pagamento pendente",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    dotClass: "bg-amber-500",
    chartColor: "#fbbf24",
    category: "payment",
    description: "Aguardando confirmação de pagamento",
  },
  payment_incomplete: {
    value: "payment_incomplete",
    label: "Pagamento não concluído",
    badgeClass: "bg-orange-100 text-orange-800 border border-orange-200",
    dotClass: "bg-orange-500",
    chartColor: "#fb923c",
    category: "payment",
    description: "Cliente saiu do checkout ou o gateway recusou",
  },
  abandoned_cart: {
    value: "abandoned_cart",
    label: "Carrinho abandonado",
    badgeClass: "bg-stone-100 text-stone-700 border border-stone-200",
    dotClass: "bg-stone-500",
    chartColor: "#a8a29e",
    category: "exception",
    description: "Pedido expirou sem tentativa de pagamento",
  },
  abandoned_sale: {
    value: "abandoned_sale",
    label: "Venda desistida",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
    dotClass: "bg-rose-500",
    chartColor: "#fb7185",
    category: "exception",
    description: "Cliente pediu cancelamento antes do envio",
  },
  processing: {
    value: "processing",
    label: "Processando",
    badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
    dotClass: "bg-blue-500",
    chartColor: "#3b82f6",
    category: "logistics",
    description: "Pagamento aprovado, aguardando expedição",
  },
  shipped: {
    value: "shipped",
    label: "Enviado",
    badgeClass: "bg-purple-100 text-purple-800 border border-purple-200",
    dotClass: "bg-purple-500",
    chartColor: "#a855f7",
    category: "logistics",
    description: "Pedido em trânsito",
  },
  delivered: {
    value: "delivered",
    label: "Entregue",
    badgeClass: "bg-green-100 text-green-800 border border-green-200",
    dotClass: "bg-green-500",
    chartColor: "#10b981",
    category: "logistics",
    description: "Entrega confirmada",
  },
  cancelled: {
    value: "cancelled",
    label: "Cancelado",
    badgeClass: "bg-red-100 text-red-800 border border-red-200",
    dotClass: "bg-red-500",
    chartColor: "#ef4444",
    category: "exception",
    description: "Cancelado por motivos gerais",
  },
  return_requested: {
    value: "return_requested",
    label: "Devolução solicitada",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-100",
    dotClass: "bg-orange-400",
    chartColor: "#fb923c",
    category: "return",
  },
  return_approved: {
    value: "return_approved",
    label: "Devolução aprovada",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-100",
    dotClass: "bg-blue-400",
    chartColor: "#60a5fa",
    category: "return",
  },
  return_label_generated: {
    value: "return_label_generated",
    label: "Etiqueta de devolução",
    badgeClass: "bg-purple-50 text-purple-700 border border-purple-100",
    dotClass: "bg-purple-400",
    chartColor: "#c084fc",
    category: "return",
  },
  return_in_transit: {
    value: "return_in_transit",
    label: "Devolução em trânsito",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-100",
    dotClass: "bg-amber-400",
    chartColor: "#fbbf24",
    category: "return",
  },
  return_received: {
    value: "return_received",
    label: "Devolução recebida",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    dotClass: "bg-emerald-400",
    chartColor: "#34d399",
    category: "return",
  },
  return_rejected: {
    value: "return_rejected",
    label: "Devolução rejeitada",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-100",
    dotClass: "bg-rose-400",
    chartColor: "#fb7185",
    category: "return",
  },
};

export const DASHBOARD_STATUS_FLOW: OrderStatus[] = [
  "payment_pending",
  "payment_incomplete",
  "abandoned_cart",
  "abandoned_sale",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_VALUES = Object.keys(
  ORDER_STATUS_META
) as OrderStatus[];

export const PAYMENT_RELATED_STATUSES: OrderStatus[] = [
  "payment_pending",
  "payment_incomplete",
  "abandoned_cart",
  "abandoned_sale",
];

export const FULFILLMENT_STATUSES: OrderStatus[] = [
  "processing",
  "shipped",
  "delivered",
];

export function getOrderStatusMeta(status: string): OrderStatusMeta {
  const normalized = (status as OrderStatus) in ORDER_STATUS_META
    ? (status as OrderStatus)
    : "processing";
  return ORDER_STATUS_META[normalized];
}
