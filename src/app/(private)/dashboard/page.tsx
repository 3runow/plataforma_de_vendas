import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardOverview } from "./components/dashboard-overview";
import { ProductsManagement } from "./components/products-management";
import { OrdersManagement } from "./components/orders-management";
import { UsersManagement } from "./components/users-management";

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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        take: 5,
        include: {
          user: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Calcula métricas
    const totalRevenue = orders
      .filter((order: any) => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total, 0);
    
    const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;
    const totalProducts = products.length;
    const totalUsers = users.length;

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600 mt-2">Bem-vindo, {user.name}</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview 
                totalRevenue={totalRevenue}
                pendingOrders={pendingOrders}
                totalProducts={totalProducts}
                totalUsers={totalUsers}
                recentOrders={recentOrders}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProductsManagement products={products} />
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
  } catch (err) {
    redirect("/login");
  }
}
