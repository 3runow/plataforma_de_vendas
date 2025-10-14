import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountTabs } from "./components/account-tabs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MinhaContaPage() {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  // Buscar dados completos do usuário
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      phone: true,
      createdAt: true,
      addresses: {
        orderBy: {
          isDefault: "desc",
        },
      },
      orders: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          address: true,
        },
      },
    },
  });

  if (!userData) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a loja
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais, endereços e pedidos
          </p>
        </div>

        <AccountTabs user={userData} />
      </div>
    </div>
  );
}
