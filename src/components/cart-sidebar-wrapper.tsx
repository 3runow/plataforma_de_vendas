"use client";

import { useEffect, useState } from "react";
import CartSidebar from "./cart-sidebar";
import { Product } from "../../types/types";

export default function CartSidebarWrapper() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          const productsData = Array.isArray(data) ? data : data.products || [];
          setProducts(productsData);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProducts();
  }, []);

  return <CartSidebar products={products} />;
}
