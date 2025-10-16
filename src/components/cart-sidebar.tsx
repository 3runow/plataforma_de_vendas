"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import CartItem from "./cart-item";
import CartSummary from "./cart-summary";
import { useCart } from "../contexts/cart-context";

interface ProductStock {
  id: number;
  stock: number;
}

interface CartSidebarProps {
  productsStock: ProductStock[];
}

export default function CartSidebar({ productsStock = [] }: CartSidebarProps) {
  const [open, setOpen] = useState(false);
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const subtotal = getTotalPrice();
  const shipping = subtotal > 0 ? 15.0 : 0;
  const total = subtotal + shipping;
  const itemCount = getTotalItems();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#f7f7f7] hover:bg-white/10"
        >
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Meu Carrinho
          </SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Seu carrinho está vazio"
              : `Você tem ${itemCount} ${
                  itemCount === 1 ? "item" : "itens"
                } no carrinho`}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg">Seu carrinho está vazio</p>
              <p className="text-sm">Adicione produtos para começar</p>
            </div>
          ) : (
            cartItems.map((item) => {
              // Buscar o estoque do produto
              const productStock = productsStock.find(
                (p) => p.id === item.productId
              );
              const maxQuantity = productStock?.stock ?? 99;
              return (
                <CartItem
                  key={item.id}
                  id={item.productId.toString()}
                  name={item.name}
                  price={item.price}
                  quantity={item.quantity}
                  image={item.image}
                  maxQuantity={maxQuantity}
                  onUpdateQuantity={(_id: string, qty: number) =>
                    updateQuantity(item.productId, qty)
                  }
                  onRemove={() => removeFromCart(item.productId)}
                />
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <CartSummary
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            onClose={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
