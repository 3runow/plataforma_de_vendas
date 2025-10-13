"use client";

import { useEffect, useState } from "react";
import ProductList from "./product-list";
import { Product } from "../../types/types";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";

export default function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar produtos");
      }

      const data = await response.json();

      // a resposta da API pode vir em diferentes formatos, entao aq vai normalizar
      const productsData = Array.isArray(data) ? data : data.products || [];

      setProducts(productsData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setError(
        "Não foi possível carregar os produtos. Tente novamente mais tarde."
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-gray-500">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <p className="text-lg text-red-500">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg text-gray-500">
            Nenhum produto disponível no momento.
          </p>
        </div>
      </div>
    );
  }

  return <ProductList products={products} onAddToCart={handleAddToCart} />;
}
