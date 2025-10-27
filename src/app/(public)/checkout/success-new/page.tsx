"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function CheckoutSuccessNewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processOrder();
  }, []);

  const processOrder = async () => {
    try {
      console.log("=== PROCESSANDO PEDIDO ===");

      // Criar pedido robusto
      const response = await fetch("/api/order/create-robust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("Resposta da criação do pedido:", data);

      if (response.ok && data.order?.id) {
        console.log("Pedido criado com sucesso:", data.order.id);
        setOrderId(data.order.id);

        // Criar pedido no Melhor Envio
        try {
          const shippingResponse = await fetch("/api/shipping/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.order.id }),
          });

          if (shippingResponse.ok) {
            console.log("Pedido criado no Melhor Envio com sucesso");
          } else {
            console.log("Aviso: Não foi possível criar pedido no Melhor Envio");
          }
        } catch (shippingError) {
          console.log(
            "Aviso: Erro ao criar pedido no Melhor Envio:",
            shippingError
          );
        }

        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push(`/checkout/confirmation?orderId=${data.order.id}`);
        }, 3000);
      } else {
        console.error("Erro ao criar pedido:", data);
        setError(data.error || "Erro ao processar pedido");
      }
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      setError("Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Processando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="p-8 text-center">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-red-500 text-3xl">×</span>
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">
              Erro no Processamento
            </h1>
            <p className="text-gray-600 mb-6 text-lg">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/checkout">Tentar Novamente</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Voltar à Loja</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Pedido Concluído com Sucesso!
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Seu pedido foi processado e está sendo preparado.
          </p>
          {orderId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Número do pedido: #{orderId}
              </p>
              <p className="text-green-600 text-sm mt-2">
                Redirecionando para a confirmação...
              </p>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">Voltar à Loja</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/minha-conta">Ver Meus Pedidos</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessNewContent />
    </Suspense>
  );
}
