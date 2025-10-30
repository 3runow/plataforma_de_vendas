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
}: MainContentProps) {
  // Características dummy por enquanto
  const characteristics = [
    { label: "Conteúdo da caixa", value: `${name} + manual` },
    { label: "Peças", value: "80 peças coloridas" },
    { label: "Dimensões", value: "5,8 x 3,6 x 5,8cm (LxPxA)" },
    { label: "Material", value: "Plástico ABS premium" },
  ];

  const isOutOfStock = stock === 0;

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

          {/* DeliveryCheck abaixo do bloco do carrinho */}
          <DeliveryCheck
            cep={userSelections.cep || ""}
            address={userSelections.address}
            onCepChangeAction={onCepChangeAction}
            onCheckDeliveryAction={onCheckDeliveryAction}
          />

          {/* Accordion de características continua abaixo de DeliveryCheck */}
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
