import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardOverview } from "./components/dashboard-overview";
import { ProductsManagement } from "./components/products-management";
import { OrdersManagement } from "./components/orders-management";
import { UsersManagement } from "./components/users-management";
import StockManagement from "./components/stock-management";
import StockAlerts from "./components/stock-alerts";
import { AlertTriangle } from "lucide-react";

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
    redirect("/login");
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
    const decoded = jwt.verify(token as string, JWT_SECRET) as {
      id: number;
      email: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) return redirect("/login");

    // Verifica se o usuário é admin
    if (user.role !== "admin") {
      redirect("/"); // Redireciona para home se não for admin
    }

    // Busca dados para o dashboard
    const [products, orders, users, recentOrders] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        include: {
          user: true,
          items: {
            include: {
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
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Conta produtos com estoque baixo
    const lowStockCount = products.filter((p) => p.stock < 10).length;
    const lowStockProducts = products.filter((p) => p.stock < 10);

    // Calcula métricas
    const totalRevenue = (orders as OrderWithRelations[])
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrdersCount = (orders as OrderWithRelations[]).filter(
      (order) => order.status === "pending"
    ).length;
    const totalProducts = products.length;
    const totalUsers = users.length;

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard Administrativo
              </h1>
              <p className="text-gray-600 mt-2">Bem-vindo, {user.name}</p>
            </div>
            {lowStockCount > 0 && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <p className="text-sm text-orange-700">
                  <strong>Atenção:</strong> {lowStockCount} produto
                  {lowStockCount > 1 ? "s" : ""} com estoque baixo (menos de 10
                  unidades). Veja na aba <strong>Estoque</strong>.
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="stock" className="relative">
                Estoque
                {lowStockCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 px-1.5 py-0 text-xs"
                  >
                    {lowStockCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview
                totalRevenue={totalRevenue}
                pendingOrders={pendingOrdersCount}
                totalProducts={totalProducts}
                totalUsers={totalUsers}
                recentOrders={recentOrders as OrderWithRelations[]}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProductsManagement products={products} />
            </TabsContent>

            <TabsContent value="stock" className="space-y-6">
              {lowStockProducts.length > 0 && (
                <StockAlerts products={lowStockProducts} />
              )}
              <StockManagement products={products} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <OrdersManagement orders={orders} />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UsersManagement users={users} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch {
    redirect("/login");
  }
}
