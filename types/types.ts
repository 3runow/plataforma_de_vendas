export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  discount?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo serializável para uso em componentes client
export interface SerializableProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  discount?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  discount?: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  discount?: number;
}

// Tipos para integração com Mercado Pago
export interface MercadoPagoPayment {
  id: string;
  status:
    | "pending"
    | "approved"
    | "authorized"
    | "in_process"
    | "in_mediation"
    | "rejected"
    | "cancelled"
    | "refunded"
    | "charged_back";
  status_detail: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  metadata?: {
    order_id: number;
  };
}

// Tipos para integração com Melhor Envio
export interface ShippingOption {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  price: number;
  discount: number;
  delivery_time: number;
  delivery_range: {
    min: number;
    max: number;
  };
  custom_price: number;
  error?: string;
}

export interface MelhorEnvioOrder {
  id: string;
  protocol: string;
  tracking: string;
  status: string;
  service_id: number;
  agency_id?: number;
  from: Address;
  to: Address;
  products: Array<{
    name: string;
    quantity: number;
    unitary_value: number;
  }>;
  volumes: Array<{
    height: number;
    width: number;
    length: number;
    weight: number;
  }>;
}

export interface Address {
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
