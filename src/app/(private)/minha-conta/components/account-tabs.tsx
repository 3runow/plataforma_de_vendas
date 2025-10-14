"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalInfoTab } from "./personal-info-tab";
import { AddressesTab } from "./addresses-tab";
import { OrdersTab } from "./orders-tab";
import { SecurityTab } from "./security-tab";
import { User, MapPin, ShoppingBag, Lock } from "lucide-react";

interface Address {
  id: number;
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
      <TabsList className="grid w-full grid-cols-4 mb-8">
        <TabsTrigger value="personal" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Dados Pessoais</span>
        </TabsTrigger>
        <TabsTrigger value="addresses" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Endereços</span>
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Pedidos</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
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
        <OrdersTab orders={user.orders} />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab />
      </TabsContent>
    </Tabs>
  );
}
