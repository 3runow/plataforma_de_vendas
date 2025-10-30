import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetailClient from "./product-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const productId = parseInt(id);

  if (Number.isNaN(productId)) return notFound();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetailClient product={product} />
    </div>
  );
}


