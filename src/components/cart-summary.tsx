"use client";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useRouter } from "next/navigation";

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
  onClose?: () => void;
}

export default function CartSummary({
  subtotal,
  shipping,
  total,
  onClose,
}: CartSummaryProps) {
  const router = useRouter();

  const handleCheckout = () => {
    onClose?.(); // Fecha o sidebar
    // O middleware vai verificar autenticação e redirecionar se necessário
    router.push("/checkout");
  };

  return (
    <>
      <Separator className="my-4" />
      <div className="space-y-4 px-4 py-8">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span className="font-medium">R$ {shipping.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary">
              R$ {total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={handleCheckout}>
            Finalizar Compra
          </Button>
          <Button variant="outline" className="w-full">
            Continuar Comprando
          </Button>
        </div>
      </div>
    </>
  );
}
