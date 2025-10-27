"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Edit, Trash2, Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onUpdate: () => void;
}

export function AddressCard({ address, onEdit, onUpdate }: AddressCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/addresses/${address.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Endereço excluído com sucesso.",
        });
        onUpdate();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir endereço");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao excluir endereço",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    setIsSettingDefault(true);

    try {
      const response = await fetch(`/api/addresses/${address.id}/set-default`, {
        method: "PUT",
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Endereço padrão definido.",
        });
        onUpdate();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Erro ao definir endereço padrão");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao definir endereço padrão",
        variant: "destructive",
      });
    } finally {
      setIsSettingDefault(false);
    }
  };

  return (
    <Card className={address.isDefault ? "border-blue-500 border-2" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
            {address.name && (
              <Badge variant="outline" className="flex-shrink-0">
                {address.name}
              </Badge>
            )}
            <h3 className="font-semibold truncate">{address.recipientName}</h3>
          </div>
          {address.isDefault && (
            <Badge className="bg-blue-500 flex-shrink-0">
              <Star className="h-3 w-3 mr-1" />
              Padrão
            </Badge>
          )}
        </div>

        <div className="space-y-1 text-sm text-gray-600 mb-4">
          <p className="break-words">
            {address.street}, {address.number}
            {address.complement && ` - ${address.complement}`}
          </p>
          <p className="break-words">
            {address.neighborhood} - {address.city}/{address.state}
          </p>
          <p>CEP: {address.cep}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!address.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetDefault}
              disabled={isSettingDefault}
              className="flex-1 w-full sm:w-auto"
            >
              {isSettingDefault ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Star className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Definir como Padrão</span>
              <span className="sm:hidden">Padrão</span>
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1 sm:flex-none"
            >
              <Edit className="h-4 w-4 sm:mr-0" />
              <span className="ml-2 sm:hidden">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 sm:mr-0" />
                  <span className="ml-2 sm:hidden">Excluir</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
