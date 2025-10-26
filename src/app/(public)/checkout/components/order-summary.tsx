"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "../../../../../types/types";

interface OrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  isLoading: boolean;
  paymentProcessed: boolean;
}

export default function OrderSummary({
  cartItems,
  subtotal,
  shipping,
  total,
  isLoading,
  paymentProcessed,
}: OrderSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.quantity}x {item.name}
              </span>
              <span className="font-medium">
                R$ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span className="font-medium">R$ {shipping.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">R$ {total.toFixed(2)}</span>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading || !paymentProcessed}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processando...
            </div>
          ) : !paymentProcessed ? (
            "Processe o pagamento primeiro"
          ) : (
            "Confirmar Pedido"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Ao confirmar, você concorda com nossos termos e condições
        </p>
      </CardContent>
    </Card>
  );
}
