"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
  X,
  Truck,
} from "lucide-react";

interface OrderDetailsModalProps {
  orderId: number;
  isOpen: boolean;
  onCloseAction: () => void;
}

interface OrderDetails {
  id: number;
  total: number;
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paymentId: string | null;
  shippingService: string | null;
  shippingPrice: number | null;
  shippingDeliveryTime: number | null;
  shippingTrackingCode: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  address: {
    recipientName: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    product: {
      name: string;
      imageUrl: string | null;
    };
  }>;
}

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "shipped":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Pendente";
    case "processing":
      return "Processando";
    case "shipped":
      return "Enviado";
    case "delivered":
      return "Entregue";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
  }
};

const getPaymentStatusColor = (status: string | null) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPaymentStatusLabel = (status: string | null) => {
  switch (status) {
    case "approved":
      return "Aprovado";
    case "pending":
      return "Pendente";
    case "failed":
      return "Falhou";
    default:
      return "Não informado";
  }
};

const getPaymentMethodLabel = (method: string | null) => {
  switch (method) {
    case "credit_card":
      return "Cartão de Crédito";
    case "pix":
      return "PIX";
    case "boleto":
      return "Boleto";
    default:
      return method || "Não informado";
  }
};

export function OrderDetailsModal({
  orderId,
  isOpen,
  onCloseAction,
}: OrderDetailsModalProps) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/order/${id}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes do pedido");
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onCloseAction} />

      {/* Modal */}
      <Card className="relative w-full max-w-6xl h-[85vh] shadow-xl border-0 flex flex-col rounded-xl overflow-hidden">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <CardTitle className="text-xl font-semibold flex items-center gap-3 text-gray-900">
            <Package className="h-6 w-6 text-gray-600" />
            Detalhes do Pedido #{orderId}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseAction}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        {/* Content with scroll */}
        <CardContent className="flex-1 p-6 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600">
                  Carregando detalhes do pedido...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <p className="text-lg">Erro: {error}</p>
              </div>
            </div>
          )}

          {order && !loading && (
            <div className="space-y-6">
              {/* Informações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        ID do Pedido
                      </p>
                      <p className="text-lg font-bold">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Data do Pedido
                      </p>
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(order.total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid com informações principais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Itens do Pedido */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      Itens do Pedido ({order.items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          {item.product.imageUrl && (
                            <Image
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {item.product.name}
                            </h4>
                            <div className="grid grid-cols-3 gap-2 mt-1 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Quantidade
                                </p>
                                <p className="font-medium">{item.quantity}x</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Preço Unit.
                                </p>
                                <p className="font-medium">
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Subtotal
                                </p>
                                <p className="font-bold text-primary">
                                  {formatCurrency(item.price * item.quantity)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                        <span className="text-xl font-bold text-gray-900">
                          Total do Pedido:
                        </span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Nome
                        </p>
                        <p className="text-sm">{order.user.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Email
                        </p>
                        <p className="text-sm text-muted-foreground break-all">
                          {order.user.email}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Grid com Envio, Pagamento e Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Envio */}
                {order.shippingService && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-orange-600" />
                        Envio
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Serviço
                          </p>
                          <p className="text-sm">{order.shippingService}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Preço do Frete
                          </p>
                          <p className="text-sm">
                            {formatCurrency(order.shippingPrice || 0)}
                          </p>
                        </div>
                        {order.shippingDeliveryTime && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Prazo
                            </p>
                            <p className="text-sm">
                              {order.shippingDeliveryTime} dias úteis
                            </p>
                          </div>
                        )}
                        {order.shippingTrackingCode && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Rastreamento
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {order.shippingTrackingCode}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Método
                        </p>
                        <p className="text-sm">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Status
                        </p>
                        <Badge
                          className={getPaymentStatusColor(order.paymentStatus)}
                        >
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </Badge>
                      </div>
                      {order.paymentId && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            ID do Pagamento
                          </p>
                          <p className="text-xs font-mono text-muted-foreground break-all">
                            {order.paymentId}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Endereço */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-red-600" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Destinatário
                        </p>
                        <p className="text-sm">{order.address.recipientName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Endereço
                        </p>
                        <div className="text-sm text-muted-foreground">
                          <p>
                            {order.address.street}, {order.address.number}
                            {order.address.complement &&
                              ` - ${order.address.complement}`}
                          </p>
                          <p>
                            {order.address.neighborhood} - {order.address.city}/
                            {order.address.state}
                          </p>
                          <p className="font-mono">CEP: {order.address.cep}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
