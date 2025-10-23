"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Script from "next/script";

interface MercadoPagoInstance {
  bricks: () => {
    create: (type: string, id: string, options: unknown) => Promise<void>;
  };
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale: string }) => MercadoPagoInstance;
  }
}

interface PaymentData {
  amount: number;
  [key: string]: unknown;
}

interface MercadoPagoPaymentProps {
  amount: number;
  onPaymentSuccessAction: (paymentData: PaymentData) => void;
  onPaymentErrorAction: (error: string) => void;
}

export default function MercadoPagoPayment({
  amount,
  onPaymentSuccessAction,
  onPaymentErrorAction,
}: MercadoPagoPaymentProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mp, setMp] = useState<MercadoPagoInstance | null>(null);

  useEffect(() => {
    if (sdkLoaded && window.MercadoPago) {
      // Tenta pegar do env, senão usa a chave diretamente
      const publicKey = 
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || 
        "TEST-6dc16094-e309-4bb2-94c3-9cb3608e274f";
      
      if (!publicKey) {
        console.error("Mercado Pago public key not found");
        return;
      }
      const mercadopago = new window.MercadoPago(publicKey, {
        locale: "pt-BR",
      });
      setMp(mercadopago);
    }
  }, [sdkLoaded]);

  const handlePayment = async () => {
    if (!mp) {
      onPaymentErrorAction("SDK do Mercado Pago não carregado");
      return;
    }

    setLoading(true);

    try {
      // Aqui você pode adicionar a lógica para processar o pagamento
      // Por exemplo, criar um formulário de pagamento do Mercado Pago

      // Exemplo simplificado - em produção, você deve usar o Checkout Pro ou Checkout Transparente
      const paymentData: PaymentData = {
        amount: amount,
        // Adicione outros dados necessários
      };

      onPaymentSuccessAction(paymentData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar pagamento";
      onPaymentErrorAction(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={() => setSdkLoaded(true)}
      />

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Pagamento com Mercado Pago</h3>

        {!sdkLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Total a pagar:
              </p>
              <p className="text-2xl font-bold">R$ {amount.toFixed(2)}</p>
            </div>

            <div id="mercadopago-payment-form" className="min-h-[200px]">
              {/* O formulário do Mercado Pago será renderizado aqui */}
              <p className="text-sm text-muted-foreground text-center py-8">
                O formulário de pagamento do Mercado Pago aparecerá aqui.
                <br />
                Configure suas credenciais no arquivo .env
              </p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={loading || !mp}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Finalizar Pagamento"
              )}
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
