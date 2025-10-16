"use client";

import Image from "next/image";
import { ShoppingCart, Heart } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { SerializableProduct } from "../../types/types";
import { useState } from "react";
import { useFavorites } from "@/contexts/favorites-context";

interface ProductCardProps {
  product: SerializableProduct;
  onAddToCart?: (product: SerializableProduct, quantity: number) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();

  const isFavorited = isFavorite(product.id);

  const finalPrice = product.discount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async () => {
    if (isOutOfStock || !onAddToCart) return;

    setIsAdding(true);
    try {
      await onAddToCart(product, quantity);
      setQuantity(1);
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = () => {
    if (isFavorited) {
      removeFromFavorites(product.id);
    } else {
      addToFavorites(product);
    }
  };

  return (
    <div className="relative">
      {/* Fita adesiva azul clara no topo - estilo polaroid */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-gradient-to-b from-sky-200 to-sky-300 rounded-sm shadow-md z-20 opacity-80 -rotate-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(186, 230, 253, 0.9) 0%, rgba(125, 211, 252, 0.85) 100%)",
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(0,0,0,0.1)",
        }}
      ></div>

      <Card
        className="group overflow-visible hover:shadow-2xl transition-all duration-300 bg-[#f5f1e8] border-[#e8e1d3] shadow-lg rounded-none"
        style={{
          boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Container da imagem estilo polaroid */}
        <div className="relative aspect-square overflow-hidden bg-white m-4 mb-2 shadow-inner rounded-none">
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {product.isNew && (
              <Badge
                variant="default"
                className="bg-blue-500 hover:bg-blue-600"
              >
                Novo
              </Badge>
            )}
            {(product.discount ?? 0) > 0 && (
              <Badge variant="destructive">-{product.discount}%</Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge
                variant="secondary"
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                Últimas unidades
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="secondary" className="bg-gray-500 text-white">
                Esgotado
              </Badge>
            )}
            {product.isFeatured && (
              <Badge
                variant="default"
                className="bg-purple-500 hover:bg-purple-600"
              >
                Destaque
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 z-10 bg-white/80 hover:bg-white transition-colors ${
              isFavorited ? "text-red-500" : "text-gray-600"
            }`}
          >
            <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
          </Button>

          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain transition-transform duration-300 group-hover:scale-105 p-4"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sem imagem
            </div>
          )}
        </div>

        {/* Área de informações estilo polaroid (parte inferior da foto) */}
        <CardContent className="p-4 pt-2 bg-[#f5f1e8]">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 text-gray-800">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {product.description}
          </p>

          <div className="flex items-center gap-2">
            {(product.discount ?? 0) > 0 ? (
              <>
                <span className="text-2xl font-bold text-primary">
                  R$ {finalPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  R$ {product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-primary">
                R$ {product.price.toFixed(2)}
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            {isOutOfStock ? (
              <span className="text-red-500 font-medium">Sem estoque</span>
            ) : (
              <span>Estoque: {product.stock} unidades</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex gap-2 bg-[#f5f1e8]">
          {!isOutOfStock && (
            <div className="flex items-center border rounded-md bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-9 w-9 p-0"
                disabled={quantity <= 1}
              >
                -
              </Button>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) => {
                  const val = Math.max(
                    1,
                    Math.min(product.stock, Number(e.target.value))
                  );
                  setQuantity(val);
                }}
                className="w-12 text-center text-sm border-0 focus:ring-0 focus:outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="h-9 w-9 p-0"
                disabled={quantity >= product.stock}
              >
                +
              </Button>
            </div>
          )}

          <Button
            className="flex-1"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isAdding
              ? "Adicionando..."
              : isOutOfStock
                ? "Esgotado"
                : "Adicionar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
