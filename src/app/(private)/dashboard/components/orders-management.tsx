"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye } from "lucide-react";
import { OrderDetailsModal } from "./order-details-modal";
import { OrdersFilter } from "./orders-filter";
import { SyncOrdersButton } from "@/components/sync-orders-button";
import { UserRole } from "@/lib/permissions";
import { getOrderStatusMeta } from "@/constants/order-status";

interface Order {
  id: number;
  userId: number;
  addressId: number;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
  };
  items: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
  }[];
}

interface OrdersManagementProps {
  orders: Order[];
  userRole?: UserRole;
}

export function OrdersManagement({
  orders: initialOrders,
  userRole = "customer",
}: OrdersManagementProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    return getOrderStatusMeta(status).badgeClass;
  };

  const getStatusLabel = (status: string) => {
    return getOrderStatusMeta(status).label;
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do pedido");
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <Card>
      <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg mb-1">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              Gerenciamento de Pedidos
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Visualize e gerencie todos os pedidos da plataforma
            </CardDescription>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <OrdersFilter value={filterStatus} onValueChange={setFilterStatus} />
            <div className="flex items-center gap-3">
              {filterStatus !== "all" && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {filteredOrders.length} pedido{filteredOrders.length !== 1 ? "s" : ""} encontrado{filteredOrders.length !== 1 ? "s" : ""}
                </div>
              )}
              {userRole === "admin" && <SyncOrdersButton />}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm px-3">
            Nenhum pedido encontrado
          </div>
        ) : (
          <>
            {/* Desktop/Tablet - Tabela (lg e acima) */}
            <div className="hidden lg:block overflow-x-auto px-6 pb-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleOrderClick(order.id)}
                      >
                        <TableCell className="font-medium">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {order.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {order.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-[180px]">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-muted-foreground truncate"
                              >
                                {item.quantity}x {item.product.name}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{order.items.length - 2} itens
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(order.status)} text-xs`}
                          >
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderClick(order.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            {userRole === "admin" ? (
                              <Select
                                value={order.status}
                                onValueChange={(value) =>
                                  handleStatusChange(order.id, value)
                                }
                              >
                                <SelectTrigger
                                  className="w-[140px] text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="payment_pending">
                                    Aguardando Pagamento
                                  </SelectItem>
                                  <SelectItem value="payment_failed">
                                    Pagamento Falhou
                                  </SelectItem>
                                  <SelectItem value="processing">
                                    Em Preparação
                                  </SelectItem>
                                  <SelectItem value="shipped">Enviado</SelectItem>
                                  <SelectItem value="delivered">
                                    Entregue
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    Cancelado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge
                                className={`${getStatusColor(order.status)} text-xs`}
                              >
                                {getStatusLabel(order.status)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile/Tablet - Cards (abaixo de lg) */}
            <div className="lg:hidden space-y-3 px-3 pb-3">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      {/* Cabeçalho */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-xs sm:text-sm">
                              Pedido #{order.id}
                            </span>
                            <Badge
                              className={`${getStatusColor(order.status)} text-[10px] sm:text-xs`}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatDateShort(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm sm:text-base text-primary">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Cliente</p>
                        <p className="font-medium text-xs sm:text-sm">
                          {order.user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.user.email}
                        </p>
                      </div>

                      {/* Itens */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Itens
                        </p>
                        <div className="space-y-0.5">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs flex justify-between"
                            >
                              <span className="truncate flex-1">
                                {item.quantity}x {item.product.name}
                              </span>
                              <span className="ml-2 text-muted-foreground">
                                {formatCurrency(
                                  item.product.price * item.quantity
                                )}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.items.length - 3} item(ns) a mais
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderClick(order.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Ver detalhes
                          </button>
                          {userRole === "admin" ? (
                            <Select
                              value={order.status}
                              onValueChange={(value) =>
                                handleStatusChange(order.id, value)
                              }
                            >
                              <SelectTrigger
                                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <SelectValue placeholder="Alterar status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="payment_pending">Aguardando Pagamento</SelectItem>
                                <SelectItem value="payment_failed">
                                  Pagamento Falhou
                                </SelectItem>
                                <SelectItem value="processing">Em Preparação</SelectItem>
                                <SelectItem value="shipped">Enviado</SelectItem>
                                <SelectItem value="delivered">
                                  Entregue
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  Cancelado
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              className={`${getStatusColor(order.status)} text-xs`}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
      {/* Modal de detalhes do pedido */}
      {selectedOrderId && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          isOpen={isModalOpen}
          onCloseAction={handleCloseModal}
        />
      )}
    </Card>
  );
}
