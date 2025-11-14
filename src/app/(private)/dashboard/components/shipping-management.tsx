'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, Clock, CheckCircle2 } from 'lucide-react';
import { PendingShipments } from './pending-shipments';
import { ShippingStats } from './shipping-stats';
import { AllShipments } from './all-shipments';

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  shippingTrackingCode?: string | null;
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
    status: string;
    trackingCode?: string | null;
    labelUrl?: string | null;
    paid: boolean;
    posted: boolean;
    delivered: boolean;
  } | null;
}

interface ShippingManagementProps {
  orders: Order[];
}

export function ShippingManagement({ orders }: ShippingManagementProps) {
  const [activeTab, setActiveTab] = useState('pending');

  // Filtrar pedidos por status de envio
  const paidOrders = orders.filter(
    (order) => 
      order.status === 'processing' || 
      order.status === 'paid'
  );

  const pendingShipments = paidOrders.filter(
    (order) => !order.shipment || order.shipment.status === 'pending'
  );

  const readyToShip = paidOrders.filter(
    (order) => order.shipment && order.shipment.paid && !order.shipment.posted
  );

  const shipped = orders.filter(
    (order) => order.shipment?.posted && !order.shipment?.delivered
  );

  const delivered = orders.filter(
    (order) => order.shipment?.delivered
  );

  // Calcular estatísticas
  const totalShippingRevenue = orders
    .filter((order) => order.shippingPrice)
    .reduce((sum, order) => sum + (order.shippingPrice || 0), 0);

  const avgShippingCost = totalShippingRevenue / (orders.filter((o) => o.shippingPrice).length || 1);

  const stats = {
    pending: pendingShipments.length,
    readyToShip: readyToShip.length,
    shipped: shipped.length,
    delivered: delivered.length,
    totalRevenue: totalShippingRevenue,
    avgCost: avgShippingCost,
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Aguardando Envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-gray-500 mt-1">Gerar etiquetas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pronto para Postar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.readyToShip}</div>
            <p className="text-xs text-gray-500 mt-1">Com etiquetas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Em Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.shipped}</div>
            <p className="text-xs text-gray-500 mt-1">Enviados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Entregues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
            <p className="text-xs text-gray-500 mt-1">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <ShippingStats stats={stats} orders={orders} />

      {/* Tabs de Gestão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Gestão de Envios
          </CardTitle>
          <CardDescription>
            Gerencie etiquetas, rastreamento e postagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="relative">
                Aguardando
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                    {stats.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="ready" className="relative">
                Prontos
                {stats.readyToShip > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {stats.readyToShip}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Em Trânsito
              </TabsTrigger>
              <TabsTrigger value="all">
                Todos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <PendingShipments orders={pendingShipments} />
            </TabsContent>

            <TabsContent value="ready" className="mt-6">
              <PendingShipments 
                orders={readyToShip} 
                showPrintLabel={true}
                title="Pedidos Prontos para Postagem"
                emptyMessage="Nenhum pedido pronto para postar"
              />
            </TabsContent>

            <TabsContent value="shipped" className="mt-6">
              <AllShipments 
                orders={shipped}
                title="Pedidos em Trânsito"
                emptyMessage="Nenhum pedido em trânsito"
              />
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <AllShipments orders={orders} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
