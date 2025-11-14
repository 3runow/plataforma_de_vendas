"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Printer,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  shippingService?: string | null;
  shippingPrice?: number | null;
  user: {
    name: string;
    email: string;
  };
  address?: {
    cep: string;
    city: string;
    state: string;
  } | null;
  shipment?: {
    id: number;
    melhorEnvioId?: string | null;
    status: string;
    trackingCode?: string | null;
    labelUrl?: string | null;
    paid: boolean;
    error?: string | null;
  } | null;
}

interface PendingShipmentsProps {
  orders: Order[];
  showPrintLabel?: boolean;
  title?: string;
  emptyMessage?: string;
}

export function PendingShipments({
  orders,
  showPrintLabel = false,
  title = "Pedidos Aguardando Envio",
  emptyMessage = "Nenhum pedido aguardando envio",
}: PendingShipmentsProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const handleGenerateLabel = async (order: Order) => {
    if (!order.shipment?.melhorEnvioId) {
      toast({
        title: "Erro",
        description: "Frete não foi comprado para este pedido",
        variant: "destructive",
      });
      return;
    }

    setLoading(order.id);
    try {
      const response = await fetch("/api/shipping/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipmentId: order.shipment.melhorEnvioId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar etiqueta");
      }

      // Abrir etiqueta em nova aba
      window.open(data.labelUrl, "_blank");

      toast({
        title: "Sucesso!",
        description: "Etiqueta gerada e aberta em nova aba",
      });

      // Recarregar página para atualizar status
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao gerar etiqueta",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handlePurchaseShipping = async (order: Order) => {
    setLoading(order.id);
    try {
      const response = await fetch("/api/shipping/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          serviceId: 1, // Você pode adicionar lógica para escolher o serviço
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao comprar frete");
      }

      toast({
        title: "Frete Comprado!",
        description: `Código de rastreio: ${data.shipment.trackingCode}`,
      });

      // Recarregar página para atualizar status
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao comprar frete",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          {emptyMessage}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Todos os pedidos estão processados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline">{orders.length} pedido(s)</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>#{order.id}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{order.user.name}</div>
                    <div className="text-xs text-gray-500">
                      {order.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {order.address ? (
                    <div className="text-sm">
                      <div>
                        {order.address.city} - {order.address.state}
                      </div>
                      <div className="text-xs text-gray-500">
                        CEP: {order.address.cep}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Não informado</span>
                  )}
                </TableCell>
                <TableCell>
                  {order.shippingService ? (
                    <Badge variant="secondary">{order.shippingService}</Badge>
                  ) : (
                    <Badge variant="outline">Não definido</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatCurrency(order.total)}
                    </div>
                    {order.shippingPrice && (
                      <div className="text-xs text-gray-500">
                        Frete: {formatCurrency(order.shippingPrice)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Mostra erro se houver */}
                    {order.shipment?.status === "error" &&
                      order.shipment?.error && (
                        <div className="flex items-center gap-2 mr-2">
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Erro
                          </Badge>
                        </div>
                      )}

                    {/* Fluxo manual: Comprar Frete → Gerar Etiqueta → Imprimir */}
                    {showPrintLabel && order.shipment?.labelUrl ? (
                      // Etapa 3: Imprimir etiqueta
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() =>
                          order.shipment?.labelUrl &&
                          window.open(order.shipment.labelUrl, "_blank")
                        }
                        className="gap-1"
                      >
                        <Printer className="h-4 w-4" />
                        Imprimir
                      </Button>
                    ) : order.shipment?.melhorEnvioId ? (
                      // Etapa 2: Gerar etiqueta (frete já comprado)
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleGenerateLabel(order)}
                        disabled={loading === order.id}
                        className="gap-1"
                      >
                        {loading === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                        Gerar Etiqueta
                      </Button>
                    ) : (
                      // Etapa 1: Comprar frete manualmente
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handlePurchaseShipping(order)}
                        disabled={loading === order.id}
                        className="gap-1"
                      >
                        {loading === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                        Comprar Frete
                      </Button>
                    )}

                    {/* Link de rastreamento se disponível */}
                    {order.shipment?.trackingCode && (
                      <Button size="sm" variant="ghost" asChild>
                        <a
                          href={`/rastreamento/${order.shipment.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gap-1 flex items-center"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
