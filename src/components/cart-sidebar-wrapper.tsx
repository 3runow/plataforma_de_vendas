"use client";

import { useEffect, useState } from "react";
import CartSidebar from "./cart-sidebar";

interface ProductStock {
  id: number;
  stock: number;
}

export default function CartSidebarWrapper() {
  const [productsStock, setProductsStock] = useState<ProductStock[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          const productsData = Array.isArray(data) ? data : data.products || [];
          // Extrair apenas id e stock para serialização
          const stockData: ProductStock[] = productsData.map(
            (product: { id: number; stock: number }) => ({
              id: product.id,
              stock: product.stock,
            })
          );
          setProductsStock(stockData);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProducts();
  }, []);

  return <CartSidebar productsStock={productsStock} />;
}
