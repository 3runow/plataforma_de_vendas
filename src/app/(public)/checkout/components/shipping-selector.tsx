"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
}

export default function ShippingSelector({
  fromCep,
  toCep,
  products,
  onSelectShippingAction,
  selectedShipping,
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

      if (!response.ok) {
        throw new Error(data.error || "Erro ao calcular frete");
      }

      const validOptions = data.options.filter(
        (opt: ShippingOption) => !opt.error
      );
      setOptions(validOptions);

      if (validOptions.length === 0) {
        setError("Nenhuma opção de frete disponível para este CEP");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao calcular frete";
      setError(errorMessage);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fromCep, toCep, products]);

  useEffect(() => {
    if (fromCep && toCep && toCep.length === 9) {
      calculateShipping();
    }
  }, [toCep, fromCep, calculateShipping]);

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
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Selecione o tipo de entrega:</h3>
      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.id}
            onClick={() => onSelectShippingAction(option)}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedShipping?.id === option.id
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{option.company}</p>
                <p className="text-sm text-muted-foreground">{option.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Entrega em até {option.deliveryTime} dias úteis
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  R$ {option.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
