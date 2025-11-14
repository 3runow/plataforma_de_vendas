/**
 * Tipos TypeScript para Sistema de Envios
 * Melhor Envio Integration
 */

// ============================================
// TIPOS DO MELHOR ENVIO
// ============================================

export interface MelhorEnvioAddress {
  name: string;
  phone: string;
  email: string;
  document: string;
  address: string;
  complement?: string;
  number: string;
  district: string;
  city: string;
  state_abbr: string;
  country_id: string;
  postal_code: string;
}

export interface MelhorEnvioPackage {
  weight: number;
  width: number;
  height: number;
  length: number;
}

export interface MelhorEnvioProduct {
  name: string;
  quantity: number;
  unitary_value: number;
}

export interface ShippingQuote {
  id: number;
  name: string;
  company: string;
  price: number;
  discountedPrice: number;
  deliveryTime: number;
  deliveryRange: {
    min: number;
    max: number;
  };
  logo: string;
}

export interface TrackingEvent {
  id: number;
  status: string;
  description: string;
  location?: string;
  occurred_at: string;
}

export interface TrackingInfo {
  code: string;
  status: string;
  protocol: string;
  createdAt: string;
  paidAt?: string;
  postedAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  events: TrackingEvent[];
}

// ============================================
// TIPOS DE REQUEST/RESPONSE DAS APIS
// ============================================

export interface CalculateShippingRequest {
  products: Array<{
    id: number;
    quantity: number;
  }>;
  toZipCode: string;
  fromZipCode?: string;
}

export interface CalculateShippingResponse {
  success: boolean;
  sessionId: string;
  options: ShippingQuote[];
}

export interface PurchaseShippingRequest {
  orderId: number;
  serviceId: number;
  volumeId?: number;
}

export interface PurchaseShippingResponse {
  success: boolean;
  shipment: {
    id: number;
    protocol: string;
    trackingCode: string;
    labelUrl: string;
  };
}

export interface GenerateLabelRequest {
  shipmentId: string;
}

export interface GenerateLabelResponse {
  success: boolean;
  labelUrl: string;
}

export interface TrackShippingResponse {
  success: boolean;
  tracking: TrackingInfo;
}

// ============================================
// TIPOS DO BANCO DE DADOS (Prisma)
// ============================================

export interface Shipment {
  id: number;
  orderId: number;
  melhorEnvioId?: string;
  protocol?: string;
  serviceId?: number;
  serviceName?: string;
  carrier?: string;
  price?: number;
  discount?: number;
  finalPrice?: number;
  deliveryTime?: number;
  trackingCode?: string;
  status: string;
  labelUrl?: string;
  labelPrintUrl?: string;
  paid: boolean;
  paidAt?: Date;
  posted: boolean;
  postedAt?: Date;
  delivered: boolean;
  deliveredAt?: Date;
  canceled: boolean;
  canceledAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingQuoteDB {
  id: number;
  sessionId: string;
  serviceId: number;
  serviceName: string;
  carrier: string;
  price: number;
  discount: number;
  finalPrice: number;
  deliveryTime: number;
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  weight: number;
  fromZipCode: string;
  toZipCode: string;
  insurance: boolean;
  insuranceValue?: number;
  createdAt: Date;
  expiresAt: Date;
}

// ============================================
// TIPOS DE COMPONENTES
// ============================================

export interface ShippingOptionsProps {
  products: Array<{
    id: number;
    quantity: number;
  }>;
  toZipCode: string;
  onSelectAction: (option: ShippingQuote) => void;
}

export interface TrackingTimelineProps {
  trackingCode: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ============================================
// TIPOS DE UTILIDADES
// ============================================

export interface PackageDimensions {
  width: number;
  height: number;
  length: number;
  weight: number;
}

export interface StoreConfig {
  zipCode: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  address: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

export interface ShippingServiceConfig {
  token: string;
  sandbox: boolean;
  storeConfig: StoreConfig;
}

// ============================================
// ENUMS
// ============================================

export enum ShipmentStatus {
  PENDING = "pending",
  PAID = "paid",
  GENERATED = "generated",
  POSTED = "posted",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELED = "canceled",
  ERROR = "error",
}

export enum TrackingEventStatus {
  CREATED = "created",
  PAID = "paid",
  POSTED = "posted",
  IN_ROUTE = "in_route",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  EXCEPTION = "exception",
  CANCELED = "canceled",
}

// ============================================
// TIPOS DE ERRO
// ============================================

export class ShippingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ShippingError";
  }
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

// ============================================
// TIPOS DE WEBHOOK
// ============================================

export interface WebhookEvent {
  type:
    | "tracking.updated"
    | "order.posted"
    | "order.delivered"
    | "order.canceled";
  data: {
    order_id: string;
    tracking_code?: string;
    status?: string;
    tracking_events?: Array<{
      status: string;
      description: string;
      location?: string;
      occurred_at: string;
    }>;
  };
}

// ============================================
// TIPOS AUXILIARES
// ============================================

export type ShippingMethod =
  | "PAC"
  | "SEDEX"
  | "JADLOG"
  | "AZUL"
  | "LOGGI"
  | "CORREIOS";

export interface ShippingCalculation {
  products: Array<{
    id: number;
    name: string;
    quantity: number;
    weight: number;
    dimensions: {
      width: number;
      height: number;
      length: number;
    };
  }>;
  totalWeight: number;
  totalValue: number;
  packageDimensions: PackageDimensions;
}

export interface ShippingLabel {
  url: string;
  format: "pdf" | "zpl";
  size: "A4" | "10x15";
}

// ============================================
// EXPORTAÇÕES DE TIPOS DO PRISMA
// ============================================

export type { Order, Address, Product, CartItem, User } from "@prisma/client";

// ============================================
// TIPOS ESTENDIDOS
// ============================================

export interface OrderWithShipping {
  id: number;
  userId: number;
  total: number;
  status: string;
  shippingService?: string;
  shippingPrice?: number;
  shippingDeliveryTime?: number;
  shippingTrackingCode?: string;
  shipment?: Shipment;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

export interface ProductWithShipping {
  id: number;
  name: string;
  price: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
}
