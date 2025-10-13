"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Product } from "../../types/types";
import { useToast } from "@/hooks/use-toast";

interface FavoritesContextType {
  favorites: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Carregar favoritos do localStorage quando o componente montar
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Salvar favoritos no localStorage sempre que mudar (exceto na inicialização)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isInitialized]);

  const addToFavorites = useCallback(
    (product: Product) => {
      setFavorites((prev) => {
        if (prev.some((p) => p.id === product.id)) {
          return prev;
        }

        // Usar setTimeout para evitar chamar toast durante render
        setTimeout(() => {
          toast({
            title: "Adicionado aos favoritos!",
            description: `${product.name} foi adicionado aos seus favoritos.`,
            duration: 2000,
          });
        }, 0);

        return [...prev, product];
      });
    },
    [toast]
  );

  const removeFromFavorites = useCallback(
    (productId: number) => {
      setFavorites((prev) => {
        const product = prev.find((p) => p.id === productId);

        if (product) {
          // Usar setTimeout para evitar chamar toast durante render
          setTimeout(() => {
            toast({
              title: "Removido dos favoritos",
              description: `${product.name} foi removido dos seus favoritos.`,
              duration: 2000,
            });
          }, 0);
        }

        return prev.filter((p) => p.id !== productId);
      });
    },
    [toast]
  );

  const isFavorite = useCallback(
    (productId: number) => {
      return favorites.some((p) => p.id === productId);
    },
    [favorites]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
