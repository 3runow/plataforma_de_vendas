"use client";

import { useEffect, useState } from "react";
import HeaderClient from "@/components/header-client";
import ProductList from "@/components/product-list";
import { useCart } from "@/contexts/cart-context";
import { Product } from "../../types/types";
import { useToast } from "@/hooks/use-toast";
import Hero from "@/components/hero";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Bruno, faz aqui a chamada real para API

      // dados mocados de exemplo para testar
      const mockProducts: Product[] = [
        {
          id: 1,
          name: "Brick Mickey Mouse",
          description:
            "Conjunto de blocos de construção do Mickey Mouse clássico",
          price: 89.9,
          stock: 15,
          imageUrl: "/assets/image/2025-09-BRICKS-MICKEY.jpg",
          discount: 10,
          isNew: true,
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: "Brick Pikachu",
          description:
            "Monte seu próprio Pikachu com este incrível kit de blocos",
          price: 79.9,
          stock: 8,
          imageUrl: "/assets/image/2025-09-BRICKS-PIKACHU.jpg",
          discount: 15,
          isNew: false,
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          name: "Brick Stitch",
          description:
            "O adorável alienígena azul em formato de blocos de montar",
          price: 84.9,
          stock: 3,
          imageUrl: "/assets/image/2025-09-BRICKS-STITCH.jpg",
          isNew: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          name: "Brick Mario",
          description: "O famoso encanador italiano pronto para suas aventuras",
          price: 94.9,
          stock: 12,
          imageUrl: "/assets/image/2025-09-BRICKS-MARIO.jpg",
          discount: 20,
          isNew: false,
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          name: "Brick Hello Kitty",
          description: "A gatinha mais famosa do mundo em blocos de construção",
          price: 74.9,
          stock: 20,
          imageUrl: "/assets/image/2025-09-BRICKS-HELLO_KITTY.jpg",
          isNew: false,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 6,
          name: "Brick Bob Esponja",
          description: "O personagem favorito de Fenda do Biquíni",
          price: 69.9,
          stock: 0,
          imageUrl: "/assets/image/2025-09-BRICKS-BOB.jpg",
          discount: 5,
          isNew: false,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 7,
          name: "Brick Luigi",
          description: "O irmão do Mario em uma versão super divertida",
          price: 89.9,
          stock: 2,
          imageUrl: "/assets/image/2025-09-BRICKS-LUIGI.jpg",
          isNew: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 8,
          name: "Brick Pooh",
          description: "O ursinho amante de mel em blocos de montar",
          price: 79.9,
          stock: 10,
          imageUrl: "/assets/image/2025-09-BRICKS-POOH.jpg",
          discount: 10,
          isNew: false,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 9,
          name: "Brick Pato Donald",
          description: "O pato mais famoso da Disney em blocos",
          price: 84.9,
          stock: 7,
          imageUrl: "/assets/image/2025-09-BRICKS-PATO_DONALD.jpg",
          isNew: false,
          isFeatured: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 10,
          name: "Brick Minnie Rosa",
          description: "A namorada do Mickey em sua versão rosa",
          price: 89.9,
          stock: 11,
          imageUrl: "/assets/image/2025-09-BRICKS-MINNIE_ROSA.jpg",
          discount: 15,
          isNew: true,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 11,
          name: "Brick Patrick",
          description: "O melhor amigo do Bob Esponja",
          price: 69.9,
          stock: 14,
          imageUrl: "/assets/image/2025-09-BRICKS-PATRICK.jpg",
          isNew: false,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 12,
          name: "Brick Pluto",
          description: "O cachorro fiel do Mickey Mouse",
          price: 74.9,
          stock: 6,
          imageUrl: "/assets/image/2025-09-BRICKS-PLUTO.jpg",
          discount: 10,
          isNew: false,
          isFeatured: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setProducts(mockProducts);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, quantity: number) => {
    addToCart(product, quantity);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderClient />

      <Hero />

      <main className="flex-1 bg-gray-50">
        {loading ? (
          <div className="container mx-auto px-4 py-12 flex items-center justify-center">
            <p className="text-lg text-gray-500">Carregando produtos...</p>
          </div>
        ) : (
          <ProductList products={products} onAddToCart={handleAddToCart} />
        )}
      </main>
    </div>
  );
}
