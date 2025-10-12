"use client";

import { useFavorites } from "@/contexts/favorites-context";
import { useCart } from "@/contexts/cart-context";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FavoritosPage() {
  const { favorites } = useFavorites();
  const { addToCart } = useCart();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verifica se o usuário está autenticado
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  const handleAddToCart = (product: any, quantity: number) => {
    addToCart(product, quantity);
  };

  // Enquanto carrega
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Carregando...</div>
      </div>
    );
  }

  // Se não está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Faça login para ver seus favoritos
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              Para acessar sua lista de favoritos, você precisa estar logado na
              sua conta.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <LogIn className="h-5 w-5" />
                Fazer Login
              </Button>
              <Link href="/">
                <Button size="lg" variant="outline" className="gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Explorar Produtos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900">Meus Favoritos</h1>
          </div>
          <p className="text-gray-600">
            {favorites.length > 0
              ? `Você tem ${favorites.length} ${
                  favorites.length === 1
                    ? "produto favorito"
                    : "produtos favoritos"
                }`
              : "Você ainda não tem produtos favoritos"}
          </p>
        </div>

        {/* Lista de Favoritos */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-16 w-16 text-gray-300" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Nenhum favorito ainda
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              Explore nossos produtos e clique no ícone de coração para
              adicionar seus favoritos aqui!
            </p>
            <Link href="/">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Explorar Produtos
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
