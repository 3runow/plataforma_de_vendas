'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tag, X } from 'lucide-react';

interface CouponInputProps {
  onApplyCoupon: (code: string, discount: number) => void;
  onRemoveCoupon: () => void;
  appliedCoupon: { code: string; discount: number } | null;
}

export default function CouponInput({
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Digite um código de cupom');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        onApplyCoupon(data.code, data.discount);
        setCouponCode('');
        setError('');
      } else {
        setError(data.error || 'Cupom inválido');
      }
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      setError('Erro ao validar cupom');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setCouponCode('');
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-900">
                Cupom aplicado: {appliedCoupon.code}
              </p>
              <p className="text-xs text-green-700">
                Desconto de {appliedCoupon.discount}%
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium mb-2 text-gray-700">
        Cupom de Desconto
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyPress={handleKeyPress}
            placeholder="Digite o código do cupom"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isValidating}
          />
        </div>
        <Button
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isValidating ? 'Validando...' : 'Aplicar'}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
