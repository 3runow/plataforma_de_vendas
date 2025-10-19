"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Script from "next/script";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoPaymentProps {
  amount: number;
  onPaymentSuccessAction: (paymentData: any) => void;
  onPaymentErrorAction: (error: string) => void;
}

export default function MercadoPagoPayment({
  amount,
  onPaymentSuccessAction,
  onPaymentErrorAction,
}: MercadoPagoPaymentProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mp, setMp] = useState<any>(null);

  useEffect(() => {
    if (sdkLoaded && window.MercadoPago) {
      const mercadopago = new window.MercadoPago(
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY,
        {
          locale: "pt-BR",
        }
      );
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
      const paymentData = {
        amount: amount,
        // Adicione outros dados necessários
      };

      onPaymentSuccessAction(paymentData);
    } catch (error: any) {
      onPaymentErrorAction(error.message || "Erro ao processar pagamento");
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
