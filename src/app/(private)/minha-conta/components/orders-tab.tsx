"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Calendar } from "lucide-react";

interface OrderItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
  };
}

interface Address {
  recipientName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
  address: Address;
}

interface OrdersTabProps {
  orders: Order[];
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-500" },
  processing: { label: "Processando", color: "bg-blue-500" },
  shipped: { label: "Enviado", color: "bg-purple-500" },
  delivered: { label: "Entregue", color: "bg-green-500" },
  cancelled: { label: "Cancelado", color: "bg-red-500" },
};

export function OrdersTab({ orders }: OrdersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Pedidos</CardTitle>
        <CardDescription>
          Acompanhe o histórico e status dos seus pedidos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Você ainda não fez nenhum pedido.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusMap[order.status] || {
                label: order.status,
                color: "bg-gray-500",
              };

              return (
                <Card key={order.id} className="overflow-hidden">
                  <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Pedido
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            #{order.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Data
                          </p>
                          <p className="font-semibold text-sm sm:text-base flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            {new Date(order.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Total
                          </p>
                          <p className="font-semibold text-sm sm:text-base text-green-600">
                            R$ {order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="pt-4 sm:pt-6">
                    <div className="space-y-4">
                      {/* Items */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <Package className="h-4 w-4" />
                          Items do Pedido
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 sm:gap-4 p-2 bg-gray-50 rounded"
                            >
                              {item.product.imageUrl && (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">
                                  {item.product.name}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Qtd: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-sm sm:text-base flex-shrink-0">
                                R${" "}
                                {(item.product.price * item.quantity).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Endereço de entrega */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <MapPin className="h-4 w-4" />
                          Endereço de Entrega
                        </h4>
                        <div className="p-3 sm:p-4 bg-gray-50 rounded">
                          <p className="font-medium text-sm sm:text-base">
                            {order.address.recipientName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">
                            {order.address.street}, {order.address.number}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {order.address.neighborhood} - {order.address.city}/
                            {order.address.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
