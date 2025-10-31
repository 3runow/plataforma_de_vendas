"use client";

import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

interface ProductInfoProps {
  name: string;
  price: number;
  description: string;
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number | null;
  stock: number;
}

export default function ProductInfo({ name, price, description, isNew, isFeatured, discount, stock }: ProductInfoProps) {
  // Stock tags (like card)
  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = stock === 0;
  const hasDiscount = (discount ?? 0) > 0;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl flex items-center gap-2 flex-wrap">
        {name}
        {isNew && (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Novo</Badge>
        )}
        {isFeatured && (
          <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">Destaque</Badge>
        )}
        {hasDiscount && (
          <Badge variant="destructive">-{discount}%</Badge>
        )}
        {isLowStock && !isOutOfStock && (
          <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">Últimas unidades</Badge>
        )}
        {isOutOfStock && (
          <Badge variant="secondary" className="bg-gray-500 text-white">Esgotado</Badge>
        )}
      </h1>

      <div className="flex items-center space-x-2 flex-wrap">
        {hasDiscount ? (
          <>
            <span className="text-sm text-gray-500 line-through">{formatCurrencyBRL(price)}</span>
            <span className="text-3xl font-bold text-blue-600">
              {formatCurrencyBRL(price * (1 - (discount ?? 0) / 100))}
            </span>
            <Badge variant="outline" className="bg-green-100 text-green-700">Em promoção</Badge>
          </>
        ) : (
          <span className="text-3xl font-bold text-blue-600">{formatCurrencyBRL(price)}</span>
        )}
      </div>

      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
        <span className="text-sm text-gray-500">(23 avaliações)</span>
      </div>

      <p className="text-gray-700 leading-relaxed">{description}</p>
    </div>
  );
}


