"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoTab } from "./personal-info-tab";
import { AddressesTab } from "./addresses-tab";
import OrdersTab from "./orders-tab";
import { SecurityTab } from "./security-tab";
import { User, MapPin, ShoppingBag, Lock } from "lucide-react";

interface Address {
  id: number;
  name?: string | null;
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface OrderItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string | null;
  };
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
  address: Address;
}

interface UserData {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  createdAt: Date;
  addresses: Address[];
  orders: Order[];
}

interface AccountTabsProps {
  user: UserData;
}

export function AccountTabs({ user }: AccountTabsProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    if (
      tabParam &&
      ["personal", "addresses", "orders", "security"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 sm:mb-8 h-auto">
        <TabsTrigger
          value="personal"
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm"
        >
          <User className="h-4 w-4" />
          <span className="sm:hidden">Dados</span>
          <span className="hidden sm:inline">Dados Pessoais</span>
        </TabsTrigger>
        <TabsTrigger
          value="addresses"
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm"
        >
          <MapPin className="h-4 w-4" />
          <span>Endereços</span>
        </TabsTrigger>
        <TabsTrigger
          value="orders"
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Pedidos</span>
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm"
        >
          <Lock className="h-4 w-4" />
          <span className="sm:hidden">Senha</span>
          <span className="hidden sm:inline">Segurança</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="personal">
        <PersonalInfoTab user={user} />
      </TabsContent>

      <TabsContent value="addresses">
        <AddressesTab addresses={user.addresses} userId={user.id} />
      </TabsContent>

      <TabsContent value="orders">
        <OrdersTab userId={user.id} />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>
    </Tabs>
  );
}
