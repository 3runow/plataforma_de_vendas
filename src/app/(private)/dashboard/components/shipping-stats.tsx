'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Package, BarChart } from 'lucide-react';

interface Stats {
  pending: number;
  readyToShip: number;
  shipped: number;
  delivered: number;
  totalRevenue: number;
  avgCost: number;
}

interface Order {
  shippingService?: string | null;
  shippingPrice?: number | null;
}

interface ShippingStatsProps {
  stats: Stats;
  orders: Order[];
}

export function ShippingStats({ stats, orders }: ShippingStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular distribuição por transportadora
  const serviceCount = orders
    .filter((o) => o.shippingService)
    .reduce((acc, order) => {
      const service = order.shippingService || 'Não definido';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topServices = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Receita com Fretes
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Custo médio: {formatCurrency(stats.avgCost)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Transportadoras Mais Usadas
          </CardTitle>
          <BarChart className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topServices.length > 0 ? (
              topServices.map(([service, count], index) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {index + 1}. {service}
                  </span>
                  <span className="text-sm text-gray-500">{count} envios</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Nenhum envio realizado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
