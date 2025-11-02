"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductList from "./product-list";
import { SerializableProduct } from "../../types/types";
import { useCart } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

export default function ProductsSection() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<SerializableProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<SerializableProduct[]>([]);
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
      setFilteredProducts(productsData);
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

  // Aplicar filtros baseado na URL
  useEffect(() => {
    const filtersParam = searchParams.get("filters");
    const selectedFilters = filtersParam ? filtersParam.split(",") : [];
    
    if (selectedFilters.length === 0) {
      setFilteredProducts(products);
      return;
    }

    let filtered = [...products];

    // Filtrar produtos que contenham qualquer uma das categorias selecionadas
    filtered = filtered.filter((product) => {
      const productName = product.name.toLowerCase();
      const productDescription = product.description?.toLowerCase() || "";
      
      return selectedFilters.some((filter: string) => {
        switch (filter) {
          case "bob-esponja":
            return productName.includes("bob") || 
                   productName.includes("esponja") || 
                   productName.includes("patrick") ||
                   productName.includes("lula molusco") ||
                   productName.includes("sirigueijo") ||
                   productDescription.includes("bob esponja");
          
          case "disney":
            return productName.includes("disney") ||
                   productName.includes("mickey") ||
                   productName.includes("minnie") ||
                   productName.includes("donald") ||
                   productName.includes("pateta") ||
                   productName.includes("pluto") ||
                   productName.includes("margarida") ||
                   productDescription.includes("disney");
          
          case "hello-kitty":
            return productName.includes("hello kitty") ||
                   productName.includes("kitty") ||
                   productDescription.includes("hello kitty");
          
          case "lilo-stitch":
            return productName.includes("lilo") ||
                   productName.includes("stitch") ||
                   productName.includes("angel") ||
                   productDescription.includes("lilo") ||
                   productDescription.includes("stitch");
          
          case "mario-bros":
            return productName.includes("mario") ||
                   productName.includes("luigi") ||
                   productName.includes("bros") ||
                   productDescription.includes("mario");
          
          case "pokemon":
            return productName.includes("pokemon") ||
                   productName.includes("pokémon") ||
                   productName.includes("pikachu") ||
                   productName.includes("psyduck") ||
                   productDescription.includes("pokemon");
          
          case "rei-leao":
            return productName.includes("simba") ||
                   productName.includes("pumba") ||
                   productName.includes("leão") ||
                   productName.includes("rei leão") ||
                   productDescription.includes("rei leão");
          
          case "ursinho-pooh":
            return productName.includes("pooh") ||
                   productName.includes("tigrao") ||
                   productName.includes("tigrão") ||
                   productName.includes("tigre") ||
                   productName.includes("leitao") ||
                   productName.includes("leitão") ||
                   productName.includes("ursinho") ||
                   productDescription.includes("pooh") ||
                   productDescription.includes("tigrao") ||
                   productDescription.includes("tigrão");
          
          default:
            return false;
        }
      });
    });

    setFilteredProducts(filtered);
  }, [searchParams, products]);

  const handleAddToCart = (product: SerializableProduct, quantity: number) => {
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

  const filtersParam = searchParams.get("filters");
  const activeFilters = filtersParam ? filtersParam.split(",") : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {filteredProducts.length === 0 && activeFilters.length > 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-lg text-gray-500 mb-2">
            Nenhum produto encontrado com os filtros selecionados.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Tente selecionar outras categorias no menu Filtros
          </p>
        </div>
      ) : (
        <>
          {activeFilters.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
            </div>
          )}
          <ProductList products={filteredProducts} onAddToCart={handleAddToCart} />
        </>
      )}
    </div>
  );
}
