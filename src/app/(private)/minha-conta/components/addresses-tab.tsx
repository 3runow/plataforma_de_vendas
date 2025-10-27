"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddressCard } from "./address-card";
import { AddressModal } from "./address-modal";

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

interface AddressesTabProps {
  addresses: Address[];
  userId: number;
}

export function AddressesTab({
  addresses: initialAddresses,
}: AddressesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleAddressUpdate = () => {
    // Recarregar a página para obter os dados atualizados
    window.location.reload();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Endereços de Entrega</CardTitle>
              <CardDescription>
                Gerencie seus endereços de entrega
              </CardDescription>
            </div>
            <Button onClick={handleAddAddress} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Endereço
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {initialAddresses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-4">Você ainda não cadastrou nenhum endereço.</p>
              <Button onClick={handleAddAddress} className="w-full sm:w-auto">
                Adicionar Primeiro Endereço
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {initialAddresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={() => handleEditAddress(address)}
                  onUpdate={handleAddressUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        address={editingAddress}
        onSuccess={handleAddressUpdate}
      />
    </>
  );
}
