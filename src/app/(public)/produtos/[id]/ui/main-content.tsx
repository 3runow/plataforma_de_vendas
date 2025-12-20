"use client";

import type { Color } from "./types";
import ImageGallery from "./image-gallery";
import ProductInfo from "./product-info";
import VariantSelector from "./variant-selector";
import DeliveryCheck from "./delivery-check";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useCart } from "@/contexts/cart-context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import type { SerializableProduct } from "../../../../../../types/types";

type Address = import("./types").Address;

interface MainContentProps {
  images: string[];
  name: string;
  price: number;
  description: string;
  sizes: string[];
  colors: Color[];
  userSelections: {
    selectedImageIndex: number;
    selectedSize?: string;
    selectedColor?: Color;
    cep?: string;
    address?: Address;
  };
  onImageSelectAction: (index: number) => void;
  onSizeSelectAction: (size: string | undefined) => void;
  onColorSelectAction: (color: Color | undefined) => void;
  onCepChangeAction: (cep: string) => void;
  onCheckDeliveryAction: (cep: string) => Promise<void>;
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number | null;
  stock: number;
  productId: number;
  pieces?: number | null;
  dimensions?: string | null;
}

export default function MainContent({
  images,
  name,
  price,
  description,
  sizes,
  colors,
  userSelections,
  onImageSelectAction,
  onSizeSelectAction,
  onColorSelectAction,
  onCepChangeAction,
  onCheckDeliveryAction,
  isNew,
  isFeatured,
  discount,
  stock,
  productId,
  pieces,
  dimensions,
}: MainContentProps) {
  const characteristics = [
    { label: "Conteúdo da caixa", value: `${name} + manual` },
    {
      label: "Peças",
      value: pieces ? `${pieces} peças coloridas` : "80 peças coloridas",
    },
    {
      label: "Dimensões",
      value: dimensions || "5,8 x 3,6 x 5,8cm (LxPxA)",
    },
    { label: "Material", value: "Plástico ABS premium" },
  ];

  // Carrinho: estado e helpers
  const { addToCart, cartItems } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = stock === 0;
  const max = stock ?? 1;
  const productBase: SerializableProduct = {
    id: productId,
    name,
    description,
    price,
    stock,
    imageUrl: images[0] || null,
    discount: discount || 0,
    isNew: isNew || false,
    isFeatured: isFeatured || false,
    createdAt: "",
    updatedAt: "",
  };
  const existingInCart =
    cartItems.find((i) => i.productId === productId)?.quantity ?? 0;
  const lowStock = !isOutOfStock && stock <= 5;

  async function handleAddToCart() {
    setIsAdding(true);
    addToCart({ ...productBase }, quantity);
    setIsAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    setQuantity(1);
  }

  async function handleBuyNow() {
    if (isOutOfStock) return;
    setIsBuying(true);
    addToCart({ ...productBase }, quantity);
    setIsBuying(false);
    router.push("/checkout");
  }

  return (
    <main className="max-w-7xl mx-auto px-0 py-0">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <ImageGallery
            images={images}
            selectedImageIndex={userSelections.selectedImageIndex}
            onImageSelectAction={onImageSelectAction}
          />
        </div>

        <div className="lg:w-1/2 space-y-8">
          <ProductInfo
            name={name}
            price={price}
            description={description}
            isNew={isNew}
            isFeatured={isFeatured}
            discount={discount}
            stock={stock}
          />

          {(sizes.length > 0 || colors.length > 0) && (
            <VariantSelector
              sizes={sizes}
              colors={colors}
              selectedSize={userSelections.selectedSize}
              selectedColor={userSelections.selectedColor}
              onSizeSelectAction={onSizeSelectAction}
              onColorSelectAction={onColorSelectAction}
            />
          )}

          {/* Bloco de carrinho */}
          <div className="flex items-center gap-2 md:gap-8">
            <div className="flex flex-col gap-2">
            <Button
              className="flex-1 bg-[#0f3d91] hover:bg-[#0c3276] text-white py-6"
              onClick={handleBuyNow}
              disabled={isOutOfStock || isBuying}
            >
              {isBuying ? "Indo para compra..." : "Comprar agora"}
            </Button>
                          <Button
              className="flex"
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
            >
              <ShoppingCart className="h-4 w-4" />
              {isAdding
                ? "Adicionando..."
                : isOutOfStock
                  ? "Esgotado"
                  : existingInCart > 0
                    ? "Adicionar mais"
                    : "Adicionar ao carrinho"}
            </Button>
            </div>
            <div className="flex flex-col"><label className="font-medium text-gray-700 pb-4" htmlFor="qnt-input">
              Quantidade:
            </label>
            <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-4"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </Button>
            <input
              id="qnt-input"
              min={1}
              max={max}
              type="number"
              value={quantity}
              disabled={isOutOfStock}
              onChange={(e) =>
                setQuantity(Math.max(1, Math.min(max, Number(e.target.value))))
              }
              className="w-14 appearance-none border border-gray-300 rounded text-center text-sm px-2 py-1 focus:ring focus:border-blue-600"
            />
            <Button
              variant="ghost"
              size="sm"
              className="p-4"
              disabled={quantity >= max}
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            >
              +
            </Button></div></div>
            

            
            {added && (
              <span className="ml-2 text-green-600 font-medium">
                Adicionado!
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {existingInCart > 0 && (
              <span>Já no carrinho: {existingInCart} • </span>
            )}
            {lowStock && (
              <span className="text-orange-600 font-medium">
                Últimas unidades
              </span>
            )}
          </div>

          {/* CEP abaixo do carrinho */}
          <DeliveryCheck
            cep={userSelections.cep || ""}
            address={userSelections.address}
            onCepChangeAction={onCepChangeAction}
            onCheckDeliveryAction={onCheckDeliveryAction}
          />

          {/* Accordion de características */}
          <Accordion type="single" collapsible className="mt-4 w-full">
            <AccordionItem value="caracteristicas">
              <AccordionTrigger className="text-lg font-semibold text-gray-900 mb-0">
                Características do produto
              </AccordionTrigger>
              <AccordionContent>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {characteristics.map((item) => (
                    <li
                      key={item.label}
                      className="rounded-md border border-gray-200 bg-white p-3"
                    >
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className="text-gray-900 font-medium">
                        {item.value}
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* descrição movida para abaixo das avaliações no ProductInfo */}
        </div>
      </div>
    </main>
  );
}
