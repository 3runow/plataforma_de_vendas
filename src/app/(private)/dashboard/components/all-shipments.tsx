'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Package, Truck } from 'lucide-react';

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  shippingTrackingCode?: string | null;
  shippingService?: string | null;
  user: {
    name: string;
  };
  shipment?: {
    status: string;
    trackingCode?: string | null;
    delivered: boolean;
    posted: boolean;
  } | null;
}

interface AllShipmentsProps {
  orders: Order[];
  title?: string;
  emptyMessage?: string;
}

export function AllShipments({ 
  orders,
  title = "Todos os Envios",
  emptyMessage = "Nenhum envio encontrado"
}: AllShipmentsProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (order: Order) => {
    if (order.shipment?.delivered) {
      return <Badge variant="default" className="bg-green-600">Entregue</Badge>;
    }
    if (order.shipment?.posted) {
      return <Badge variant="default" className="bg-blue-600">Em trânsito</Badge>;
    }
    if (order.shipment) {
      return <Badge variant="secondary">Processando</Badge>;
    }
    return <Badge variant="outline">Aguardando</Badge>;
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline">{orders.length} envio(s)</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Código de Rastreio</TableHead>
              <TableHead>Status</TableHead>
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
                  <div className="font-medium">{order.user.name}</div>
                </TableCell>
                <TableCell>
                  {order.shippingService ? (
                    <Badge variant="secondary">{order.shippingService}</Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {order.shipment?.trackingCode || order.shippingTrackingCode ? (
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {order.shipment?.trackingCode || order.shippingTrackingCode}
                    </code>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStatusBadge(order)}
                </TableCell>
                <TableCell className="text-right">
                  {(order.shipment?.trackingCode || order.shippingTrackingCode) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a
                        href={`/rastreamento/${order.shipment?.trackingCode || order.shippingTrackingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-1 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">Rastrear</span>
                      </a>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
