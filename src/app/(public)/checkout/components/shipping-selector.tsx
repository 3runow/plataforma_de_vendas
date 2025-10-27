"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package } from "lucide-react";

interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: number;
  deliveryTime: number;
  error?: string;
}

interface ShippingSelectorProps {
  fromCep: string;
  toCep: string;
  products: Array<{
    weight: number;
    width: number;
    height: number;
    length: number;
    quantity: number;
    insurance_value: number;
  }>;
  onSelectShippingAction: (option: ShippingOption | null) => void;
  selectedShipping: ShippingOption | null;
  onShippingSelected?: () => void; // Callback quando uma opção é selecionada
  recipientName?: string; // Nome do destinatário
  neighborhood?: string; // Bairro
}

export default function ShippingSelector({
  fromCep,
  toCep,
  products,
  onSelectShippingAction,
  selectedShipping,
  onShippingSelected,
  recipientName = "",
  neighborhood = "",
}: ShippingSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [error, setError] = useState<string>("");

  const calculateShipping = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromCep,
          to: toCep,
          products: products,
        }),
      });

      const data = await response.json();
      console.log("Resposta da API de frete:", data);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao calcular frete");
      }

      // Verificar se temos dados válidos
      const services = data.services || data.options || [];
      console.log("Serviços encontrados:", services);

      if (!Array.isArray(services)) {
        console.error("Resposta inválida da API de frete:", services);
        throw new Error("Resposta inválida da API de frete");
      }

      const validOptions = services
        .filter((opt: { error?: string }) => !opt.error)
        .map((opt: { 
          id: number | string; 
          name: string; 
          company: string | { name: string }; 
          price: string | number; 
          delivery_time?: number;
          deliveryTime?: number;
          delivery_range?: { max: number };
          error?: string 
        }) => ({
          id: typeof opt.id === 'string' ? parseInt(opt.id) : opt.id,
          name: opt.name,
          company:
            typeof opt.company === "object" ? opt.company.name : opt.company,
          price:
            typeof opt.price === "string" ? parseFloat(opt.price) : opt.price,
          deliveryTime:
            opt.delivery_time ||
            opt.deliveryTime ||
            opt.delivery_range?.max ||
            7,
        }));
      setOptions(validOptions);

      if (validOptions.length === 0) {
        setError("Nenhuma opção de frete disponível para este CEP");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao calcular frete";
      setError(errorMessage);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fromCep, toCep, products]);

  useEffect(() => {
    // Só calcula o frete se todos os campos obrigatórios estiverem preenchidos
    // Aceita CEP com ou sem traço (11040-111 ou 11040111)
    const cepValid =
      toCep && (toCep.length === 9 || toCep.replace(/\D/g, "").length === 8);
    const recipientValid = recipientName && recipientName.trim() !== "";
    const neighborhoodValid = neighborhood && neighborhood.trim() !== "";

    if (fromCep && cepValid && recipientValid && neighborhoodValid) {
      calculateShipping();
    } else {
      // Limpa as opções se algum campo estiver vazio
      setOptions([]);
      setError("");
    }
  }, [toCep, fromCep, recipientName, neighborhood, calculateShipping]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Calculando frete...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-red-500">{error}</p>
        <Button onClick={calculateShipping} className="mt-4" variant="outline">
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (options.length === 0) {
    const cepValid =
      toCep && (toCep.length === 9 || toCep.replace(/\D/g, "").length === 8);
    const recipientValid = recipientName && recipientName.trim() !== "";
    const neighborhoodValid = neighborhood && neighborhood.trim() !== "";

    if (!cepValid || !recipientValid || !neighborhoodValid) {
      return (
        <Card className="p-6 border-dashed border-2 border-gray-300 bg-gray-50">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              Preencha CEP, Destinatário e Bairro para ver as opções de frete
            </p>
          </div>
        </Card>
      );
    }

    return null;
  }

  return (
    <Card className="p-6 bg-white shadow-sm">
      <h3 className="font-semibold text-lg mb-4 text-gray-900">
        Selecione o tipo de entrega:
      </h3>
      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => {
              onSelectShippingAction(option);
              // Chama o callback para fechar a seção e avançar
              if (onShippingSelected) {
                setTimeout(() => onShippingSelected(), 300);
              }
            }}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedShipping?.id === option.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-primary/50 hover:shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-base text-gray-900">
                  {option.company}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">{option.name}</p>
                <p className="text-xs text-gray-500 mt-1.5">
                  Entrega em até {option.deliveryTime} dia(s) útil(is)
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-lg text-primary">
                  R$ {option.price.toFixed(2)}
                </p>
              </div>
            </div>
            {selectedShipping?.id === option.id && (
              <div className="mt-3 pt-3 border-t border-primary/20 flex items-center text-sm text-primary">
                <Package className="h-4 w-4 mr-1.5" />
                <span className="font-medium">✓ Selecionado</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
