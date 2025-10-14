"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { MetricCard } from "./metric-card";
import { SalesChart } from "./sales-chart";
import { TopProductsChart } from "./top-products-chart";
import { OrdersStatusChart } from "./orders-status-chart";
import { UserGrowthChart } from "./user-growth-chart";
import { QuickStats } from "./quick-stats";

interface OrderUser {
  id: number;
  name: string;
  email: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
}

interface RecentOrder {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  user: OrderUser;
  items: OrderItem[];
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
  label: string;
  [key: string]: string | number;
}

interface UserGrowthData {
  date: string;
  count: number;
}

interface DashboardOverviewProps {
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: RecentOrder[];
  salesData: SalesData[];
  topProducts: TopProduct[];
  statusData: StatusData[];
  userGrowthData: UserGrowthData[];
  revenueTrend?: number;
  ordersTrend?: number;
}

export function DashboardOverview({
  totalRevenue,
  pendingOrders,
  totalProducts,
  totalUsers,
  recentOrders,
  salesData,
  topProducts,
  statusData,
  userGrowthData,
  revenueTrend,
  ordersTrend,
}: DashboardOverviewProps) {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(totalRevenue)}
          description="Todas as vendas confirmadas"
          icon={DollarSign}
          iconColor="text-green-600"
          trend={
            revenueTrend
              ? {
                  value: revenueTrend,
                  isPositive: revenueTrend > 0,
                }
              : undefined
          }
        />

        <MetricCard
          title="Pedidos Pendentes"
          value={pendingOrders}
          description="Aguardando processamento"
          icon={ShoppingCart}
          iconColor="text-orange-600"
          trend={
            ordersTrend
              ? {
                  value: ordersTrend,
                  isPositive: ordersTrend < 0, // Menos pedidos pendentes é positivo
                }
              : undefined
          }
        />

        <MetricCard
          title="Produtos"
          value={totalProducts}
          description="Total de produtos cadastrados"
          icon={Package}
          iconColor="text-blue-600"
        />

        <MetricCard
          title="Usuários"
          value={totalUsers}
          description="Total de usuários registrados"
          icon={Users}
          iconColor="text-purple-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart data={salesData} />
        <OrdersStatusChart data={statusData} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TopProductsChart data={topProducts} />
        <UserGrowthChart data={userGrowthData} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* Pedidos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>
                Últimos 5 pedidos realizados na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum pedido registrado ainda
                  </p>
                ) : (
                  recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Pedido #{order.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.user.name} • {formatDate(order.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "itens"}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-sm font-bold">
                          {formatCurrency(order.total)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <QuickStats
          stats={[
            {
              label: "Ticket Médio",
              value: formatCurrency(
                recentOrders.length > 0
                  ? recentOrders.reduce((sum, o) => sum + o.total, 0) /
                      recentOrders.length
                  : 0
              ),
              change: revenueTrend,
              changeLabel: "vs mês anterior",
            },
            {
              label: "Pedidos Hoje",
              value: String(
                recentOrders.filter((o) => {
                  const today = new Date();
                  const orderDate = new Date(o.createdAt);
                  return (
                    orderDate.getDate() === today.getDate() &&
                    orderDate.getMonth() === today.getMonth() &&
                    orderDate.getFullYear() === today.getFullYear()
                  );
                }).length
              ),
            },
            {
              label: "Taxa Conversão",
              value: `${
                totalUsers > 0
                  ? ((recentOrders.length / totalUsers) * 100).toFixed(1)
                  : 0
              }%`,
            },
            {
              label: "Produtos Ativos",
              value: String(totalProducts),
            },
          ]}
        />
      </div>
    </div>
  );
}
