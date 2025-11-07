'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: number;
  discountedPrice: number;
  deliveryTime: number;
  deliveryRange: {
    min: number;
    max: number;
  };
  logo: string;
}

interface ShippingOptionsProps {
  products: Array<{
    id: number;
    quantity: number;
  }>;
  toZipCode: string;
  onSelect: (option: ShippingOption) => void;
}

export function ShippingOptions({ products, toZipCode, onSelect }: ShippingOptionsProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (products.length > 0 && toZipCode) {
      calculateShipping();
    }
  }, [products, toZipCode]);

  const calculateShipping = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          toZipCode: toZipCode.replace(/\D/g, ''),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao calcular frete');
      }

      setOptions(data.options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular frete');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const option = options.find((opt) => opt.id === selectedOption);
    if (option) {
      onSelect(option);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDeliveryTime = (days: number) => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    return `${days} dias úteis`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Opções de Envio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <span className="ml-3">Calculando fretes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Opções de Envio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-red-50 p-4 text-red-800">
            <p className="font-medium">Erro ao calcular frete</p>
            <p className="text-sm">{error}</p>
            <Button onClick={calculateShipping} variant="outline" className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (options.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Opções de Envio
          </CardTitle>
          <CardDescription>
            Informe o CEP de entrega para calcular o frete
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Opções de Envio
        </CardTitle>
        <CardDescription>
          Escolha o melhor método de envio para você
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedOption?.toString()}
          onValueChange={(value) => setSelectedOption(Number(value))}
        >
          <div className="space-y-3">
            {options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                <Label
                  htmlFor={`option-${option.id}`}
                  className="flex flex-1 cursor-pointer items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Logo da transportadora */}
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={option.logo}
                        alt={option.company}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div>
                      <p className="font-medium">{option.company}</p>
                      <p className="text-sm text-gray-500">{option.name}</p>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatDeliveryTime(option.deliveryTime)}</span>
                        {option.deliveryRange.min !== option.deliveryRange.max && (
                          <span className="text-xs text-gray-400">
                            ({option.deliveryRange.min} a {option.deliveryRange.max} dias)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {option.price !== option.discountedPrice && (
                      <p className="text-sm text-gray-400 line-through">
                        {formatCurrency(option.price)}
                      </p>
                    )}
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(option.discountedPrice)}
                    </p>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        {selectedOption && (
          <Button onClick={handleSelect} className="mt-4 w-full">
            <Package className="mr-2 h-4 w-4" />
            Confirmar Método de Envio
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
