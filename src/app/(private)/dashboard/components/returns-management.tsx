"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RotateCcw,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  type LucideIcon,
} from "lucide-react";

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  shippingTrackingCode?: string | null;
  user: {
    name: string;
    email: string;
  };
  address?: {
    recipientName: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  } | null;
  items?: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      imageUrl?: string | null;
    };
  }[];
}

interface ReturnsManagementProps {
  orders: Order[];
}

const returnStatusMap: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  return_requested: {
    label: "Solicitado",
    color: "bg-yellow-500",
    icon: Clock,
  },
  return_approved: {
    label: "Aprovado",
    color: "bg-blue-500",
    icon: CheckCircle2,
  },
  return_label_generated: {
    label: "Etiqueta Gerada",
    color: "bg-purple-500",
    icon: Package,
  },
  return_in_transit: {
    label: "Em Trânsito",
    color: "bg-orange-500",
    icon: RotateCcw,
  },
  return_received: {
    label: "Recebido",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  return_rejected: { label: "Rejeitado", color: "bg-red-500", icon: XCircle },
};

export function ReturnsManagement({ orders }: ReturnsManagementProps) {
  const [activeTab, setActiveTab] = useState("requested");
  const [isLoading, setIsLoading] = useState(false);
  const [ordersState, setOrdersState] = useState(orders);

  // Filtrar pedidos por status de devolução
  const returnRequested = ordersState.filter(
    (order) => order.status === "return_requested"
  );
  const returnApproved = ordersState.filter(
    (order) => order.status === "return_approved"
  );
  const returnInTransit = ordersState.filter(
    (order) => order.status === "return_in_transit"
  );
  const returnCompleted = ordersState.filter(
    (order) => order.status === "return_received"
  );
  const returnRejected = ordersState.filter(
    (order) => order.status === "return_rejected"
  );

  const allReturns = ordersState.filter((order) =>
    order.status.startsWith("return_")
  );

  const handleApproveReturn = async (orderId: number) => {
    if (!confirm("Deseja aprovar esta solicitação de devolução?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/returns/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Devolução aprovada com sucesso! O cliente será notificado.");
        // Atualiza o estado local
        setOrdersState(
          ordersState.map((order) =>
            order.id === orderId
              ? { ...order, status: "return_approved" }
              : order
          )
        );
      } else {
        alert(data.error || "Erro ao aprovar devolução");
      }
    } catch (error) {
      console.error("Erro ao aprovar devolução:", error);
      alert("Erro ao processar aprovação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectReturn = async (orderId: number) => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason || reason.trim() === "") {
      alert("É necessário informar o motivo da rejeição");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/returns/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, reason }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Devolução rejeitada. O cliente será notificado sobre o motivo.");
        // Atualiza o estado local
        setOrdersState(
          ordersState.map((order) =>
            order.id === orderId
              ? { ...order, status: "return_rejected" }
              : order
          )
        );
      } else {
        alert(data.error || "Erro ao rejeitar devolução");
      }
    } catch (error) {
      console.error("Erro ao rejeitar devolução:", error);
      alert("Erro ao processar rejeição");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLabel = async (orderId: number) => {
    if (!confirm("Deseja gerar a etiqueta de coleta para esta devolução?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/returns/generate-label", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Etiqueta gerada com sucesso!\n\nCódigo de rastreio: ${data.trackingCode}\n\nA etiqueta será aberta em uma nova aba.`
        );

        // Abrir etiqueta em nova aba
        if (data.labelUrl) {
          window.open(data.labelUrl, "_blank");
        }

        // Atualiza o estado local
        setOrdersState(
          ordersState.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: "return_label_generated",
                  shippingTrackingCode: data.trackingCode,
                }
              : order
          )
        );
      } else {
        alert(data.error || "Erro ao gerar etiqueta de devolução");
        if (data.details) {
          console.error("Detalhes do erro:", data.details);
        }
      }
    } catch (error) {
      console.error("Erro ao gerar etiqueta:", error);
      alert("Erro ao processar geração de etiqueta");
    } finally {
      setIsLoading(false);
    }
  };

  const renderReturnCard = (order: Order) => {
    const statusInfo = returnStatusMap[order.status] || {
      label: order.status,
      color: "bg-gray-500",
      icon: Package,
    };
    const StatusIcon = statusInfo.icon;

    return (
      <Card
        key={order.id}
        className="overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="bg-linear-to-r from-orange-50 to-red-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm">
                <RotateCcw className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Pedido #{order.id}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Badge
              className={`${statusInfo.color} flex items-center gap-2 px-3 py-1`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-700 mb-1">
                  Cliente
                </h4>
                <p className="font-medium">{order.user.name}</p>
                <p className="text-sm text-gray-600">{order.user.email}</p>
              </div>
            </div>

            {/* Endereço */}
            {order.address && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">
                    Endereço de Coleta
                  </h4>
                  <p className="font-medium">{order.address.recipientName}</p>
                  <p className="text-sm text-gray-600">
                    {order.address.street}, {order.address.number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.address.neighborhood} - {order.address.city}/
                    {order.address.state}
                  </p>
                  <p className="text-sm text-gray-600">
                    CEP: {order.address.cep}
                  </p>
                </div>
              </div>
            )}

            {/* Items do Pedido */}
            {order.items && order.items.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Items a Devolver
                </h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {item.product.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valor Total */}
            <div className="flex items-center justify-between p-4 bg-linear-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
              <span className="font-semibold text-gray-700">
                Valor da Devolução
              </span>
              <span className="text-2xl font-bold text-orange-600">
                R$ {order.total.toFixed(2)}
              </span>
            </div>

            {/* Ações */}
            {order.status === "return_requested" && (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApproveReturn(order.id)}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isLoading ? "Processando..." : "Aprovar Devolução"}
                </Button>
                <Button
                  onClick={() => handleRejectReturn(order.id)}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isLoading ? "Processando..." : "Rejeitar"}
                </Button>
              </div>
            )}

            {order.status === "return_approved" && (
              <Button
                onClick={() => handleGenerateLabel(order.id)}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Package className="h-4 w-4 mr-2" />
                {isLoading ? "Gerando..." : "Gerar Etiqueta de Coleta"}
              </Button>
            )}

            {order.shippingTrackingCode && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Código de Rastreio</p>
                <p className="font-mono font-semibold text-blue-600">
                  {order.shippingTrackingCode}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Solicitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {returnRequested.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Aguardando análise</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {returnApproved.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Gerar etiquetas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Em Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {returnInTransit.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Retornando</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {returnCompleted.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Recebidas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {returnRejected.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Não aprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Gestão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Gestão de Devoluções
          </CardTitle>
          <CardDescription>
            Gerencie as solicitações de devolução dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger
                value="requested"
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Solicitadas
                {returnRequested.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {returnRequested.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Aprovadas
              </TabsTrigger>
              <TabsTrigger
                value="in-transit"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Em Trânsito
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                Concluídas
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                Todas
                <Badge variant="secondary" className="ml-1">
                  {allReturns.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requested" className="space-y-4">
              {returnRequested.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">
                    Nenhuma devolução solicitada
                  </p>
                  <p className="text-sm">
                    Não há solicitações de devolução aguardando análise
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {returnRequested.map(renderReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {returnApproved.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">
                    Nenhuma devolução aprovada
                  </p>
                  <p className="text-sm">
                    Não há devoluções aprovadas no momento
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {returnApproved.map(renderReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="in-transit" className="space-y-4">
              {returnInTransit.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">
                    Nenhuma devolução em trânsito
                  </p>
                  <p className="text-sm">
                    Não há devoluções retornando no momento
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {returnInTransit.map(renderReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {returnCompleted.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">
                    Nenhuma devolução concluída
                  </p>
                  <p className="text-sm">Não há devoluções recebidas ainda</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {returnCompleted.map(renderReturnCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {allReturns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <RotateCcw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">
                    Nenhuma devolução registrada
                  </p>
                  <p className="text-sm">
                    Não há solicitações de devolução no sistema
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {allReturns.map(renderReturnCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
