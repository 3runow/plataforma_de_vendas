import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardOverview } from "./components/dashboard-overview";
import { ProductsManagement } from "./components/products-management";
import { OrdersManagement } from "./components/orders-management";
import { UsersManagement } from "./components/users-management";
import StockManagement from "./components/stock-management";
import StockAlerts from "./components/stock-alerts";
import { CouponsManagement } from "./components/coupons-management";
import { ShippingManagement } from "./components/shipping-management";
import { AlertTriangle, Home } from "lucide-react";
import { Product } from "../../../../types/types";

interface OrderWithRelations {
  id: number;
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

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/");
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET não configurado nas variáveis de ambiente");
    }
    const decoded = jwt.verify(token as string, JWT_SECRET) as {
      id: number;
      email: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) return redirect("/");

    // Verifica se o usuário é admin
    if (user.role !== "admin") {
      redirect("/"); // Redireciona para home se não for admin
    }

    // Busca dados para o dashboard
    const [products, orders, users, recentOrders, coupons] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        include: {
          user: true,
          address: true,
          shipment: true,
          items: {
            select: {
              id: true,
              quantity: true,
              productId: true,
              orderId: true,
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        take: 5,
        include: {
          user: true,
          items: {
            select: {
              id: true,
              quantity: true,
              productId: true,
              orderId: true,
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Converte as datas dos cupons para strings
    const formattedCoupons = coupons.map((coupon) => ({
      ...coupon,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
    }));

    // Conta produtos com estoque baixo
    const lowStockCount = products.filter((p: Product) => p.stock < 10).length;
    const lowStockProducts = products.filter((p: Product) => p.stock < 10);

    // Calcula métricas
    const totalRevenue = (orders as OrderWithRelations[])
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrdersCount = (orders as OrderWithRelations[]).filter(
      (order) => order.status === "pending"
    ).length;
    const totalProducts = products.length;
    const totalUsers = users.length;

    // Prepara dados para o gráfico de vendas (últimos 30 dias)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const salesData = last30Days.map((date) => {
      const dayOrders = (orders as OrderWithRelations[]).filter((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return (
          orderDate.getTime() === date.getTime() && order.status !== "cancelled"
        );
      });

      return {
        date: date.toISOString(),
        revenue: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      };
    });

    // Calcula produtos mais vendidos
    const productSales = new Map<
      number,
      { name: string; quantity: number; revenue: number }
    >();

    (orders as OrderWithRelations[])
      .filter((order) => order.status !== "cancelled")
      .forEach((order) => {
        order.items.forEach((item) => {
          const existing = productSales.get(item.product.id);
          if (existing) {
            existing.quantity += item.quantity;
            existing.revenue += item.product.price * item.quantity;
          } else {
            productSales.set(item.product.id, {
              name: item.product.name,
              quantity: item.quantity,
              revenue: item.product.price * item.quantity,
            });
          }
        });
      });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Calcula distribuição de status dos pedidos
    const statusCount = new Map<string, number>();
    (orders as OrderWithRelations[]).forEach((order) => {
      statusCount.set(order.status, (statusCount.get(order.status) || 0) + 1);
    });

    const statusLabels: Record<string, string> = {
      pending: "Pendente",
      processing: "Processando",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };

    const statusData = Array.from(statusCount.entries()).map(
      ([status, count]) => ({
        name: status,
        value: count,
        label: statusLabels[status] || status,
      })
    );

    // Calcula tendências (comparado com o mês anterior)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthRevenue = (orders as OrderWithRelations[])
      .filter(
        (order) =>
          new Date(order.createdAt) >= currentMonthStart &&
          order.status !== "cancelled"
      )
      .reduce((sum, order) => sum + order.total, 0);

    const lastMonthRevenue = (orders as OrderWithRelations[])
      .filter(
        (order) =>
          new Date(order.createdAt) >= lastMonthStart &&
          new Date(order.createdAt) <= lastMonthEnd &&
          order.status !== "cancelled"
      )
      .reduce((sum, order) => sum + order.total, 0);

    const revenueTrend =
      lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    const currentMonthPending = (orders as OrderWithRelations[]).filter(
      (order) =>
        new Date(order.createdAt) >= currentMonthStart &&
        order.status === "pending"
    ).length;

    const lastMonthPending = (orders as OrderWithRelations[]).filter(
      (order) =>
        new Date(order.createdAt) >= lastMonthStart &&
        new Date(order.createdAt) <= lastMonthEnd &&
        order.status === "pending"
    ).length;

    const ordersTrend =
      lastMonthPending > 0
        ? ((currentMonthPending - lastMonthPending) / lastMonthPending) * 100
        : 0;

    // Calcula crescimento de usuários (últimos 30 dias)
    const userGrowthData = last30Days.map((date) => {
      const dayUsers = users.filter((user: { createdAt: Date }) => {
        const userDate = new Date(user.createdAt);
        userDate.setHours(0, 0, 0, 0);
        return userDate.getTime() === date.getTime();
      });

      return {
        date: date.toISOString(),
        count: dayUsers.length,
      };
    });

    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-gray-50 to-gray-100 p-2 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Dashboard Administrativo
                </h1>
                <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">
                    Bem-vindo, {user.name} •{" "}
                  </span>
                  <span className="sm:hidden">Bem-vindo • </span>
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Link href="/">
                <Button
                  variant="outline"
                  className="gap-2 shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar à Loja</span>
                  <span className="sm:hidden">Loja</span>
                </Button>
              </Link>
            </div>
            {lowStockCount > 0 && (
              <div className="mt-4 p-3 sm:p-4 bg-linear-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg flex items-start gap-3 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm text-orange-900 font-medium">
                    <strong>Atenção:</strong> {lowStockCount} produto
                    {lowStockCount > 1 ? "s" : ""} com estoque baixo (menos de
                    10 unidades)
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Veja na aba <strong>Estoque</strong> para mais detalhes e
                    reposição.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-7 bg-white shadow-sm p-1 rounded-lg h-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <span className="hidden sm:inline">Visão Geral</span>
                <span className="sm:hidden">Visão</span>
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Produtos
              </TabsTrigger>
              <TabsTrigger
                value="stock"
                className="relative data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Estoque
                {lowStockCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 sm:ml-2 px-1 sm:px-1.5 py-0 text-xs animate-pulse"
                  >
                    {lowStockCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Pedidos
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Envios
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                <span className="hidden sm:inline">Usuários</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="coupons"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all text-xs sm:text-sm py-2 sm:py-2.5"
              >
                Cupons
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <DashboardOverview
                totalRevenue={totalRevenue}
                pendingOrders={pendingOrdersCount}
                totalProducts={totalProducts}
                totalUsers={totalUsers}
                recentOrders={recentOrders as OrderWithRelations[]}
                salesData={salesData}
                topProducts={topProducts}
                statusData={statusData}
                userGrowthData={userGrowthData}
                revenueTrend={revenueTrend}
                ordersTrend={ordersTrend}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-4 sm:space-y-6">
              <ProductsManagement products={products} />
            </TabsContent>

            <TabsContent value="stock" className="space-y-4 sm:space-y-6">
              {lowStockProducts.length > 0 && (
                <StockAlerts products={lowStockProducts} />
              )}
              <StockManagement products={products} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-4 sm:space-y-6">
              <OrdersManagement orders={orders} />
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4 sm:space-y-6">
              <ShippingManagement orders={orders} />
            </TabsContent>

            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <UsersManagement users={users} />
            </TabsContent>

            <TabsContent value="coupons" className="space-y-4 sm:space-y-6">
              <CouponsManagement coupons={formattedCoupons} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch {
    redirect("/");
  }
}
