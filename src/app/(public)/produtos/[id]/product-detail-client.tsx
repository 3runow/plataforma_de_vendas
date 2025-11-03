"use client";

import { useCallback, useMemo, useState } from "react";
import MainContent from "./ui/main-content";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  discount?: number | null;
  isNew?: boolean;
  isFeatured?: boolean;
};

type Address = {
  cep: string;
  logradouro: string;
  complemento?: string | null;
  bairro: string;
  localidade: string;
  uf: string;
};

type Color = { name: string; value: string };

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const images = useMemo(() => {
    const urls = (product.imageUrls && product.imageUrls.length > 0)
      ? product.imageUrls
      : (product.imageUrl ? [product.imageUrl] : []);
    return urls.length > 0 ? urls : ["/placeholder.png"];
  }, [product.imageUrl, product.imageUrls]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    undefined
  );
  const [selectedColor, setSelectedColor] = useState<Color | undefined>(
    undefined
  );
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<Address | undefined>(undefined);

  const onCheckDelivery = useCallback(async (rawCep: string) => {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length < 8) return;

    const res = await fetch(`/api/cep/${digits}`);
    if (!res.ok) return;
    const data = await res.json();
    setAddress(data);
  }, []);

  return (
    <MainContent
      images={images}
      name={product.name}
      price={product.price}
      description={product.description}
      sizes={[]}
      colors={[]}
      isNew={product.isNew}
      isFeatured={product.isFeatured}
      discount={product.discount}
      stock={product.stock}
      productId={product.id}
      userSelections={{
        selectedImageIndex,
        selectedSize,
        selectedColor,
        cep,
        address,
      }}
      onImageSelectAction={setSelectedImageIndex}
      onSizeSelectAction={setSelectedSize}
      onColorSelectAction={setSelectedColor}
      onCepChangeAction={setCep}
      onCheckDeliveryAction={onCheckDelivery}
    />
  );
}
