"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [countdown, setCountdown] = useState(5);
  const [processing, setProcessing] = useState(false);
  const [finalOrderId, setFinalOrderId] = useState<number | null>(null);

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const rawOrderId = searchParams.get("orderId");
    const orderId = rawOrderId && /^\d+$/.test(rawOrderId) ? rawOrderId : null;

    if (paymentIntent || orderId) {
      setPaymentStatus("success");
      setProcessing(true);
      processOrderCompletion(orderId);
    } else {
      setPaymentStatus("error");
    }

    setLoading(false);
  }, [searchParams]);

  const processOrderCompletion = async (orderId: string | null) => {
    try {
      if (!orderId) {
        console.log("OrderId ausente/inválido, criando pedido...");

        const createOrderResponse = await fetch("/api/order/create-from-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        console.log("Status da resposta:", createOrderResponse.status);
        console.log(
          "Headers da resposta:",
          Object.fromEntries(createOrderResponse.headers.entries())
        );

        const createOrderData = await createOrderResponse.json();
        console.log("Resposta da criação do pedido:", createOrderData);

        if (createOrderResponse.ok && createOrderData.order?.id) {
          console.log("Pedido criado com sucesso:", createOrderData.order.id);

          const processResponse = await fetch("/api/order/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: createOrderData.order.id }),
          });

          const processData = await processResponse.json();
          console.log("Resposta do processamento:", processData);

          if (processResponse.ok) {
            console.log("Pedido processado com sucesso, limpando carrinho...");
            const cartResponse = await fetch("/api/cart/clear", {
              method: "POST",
            });
            console.log("Carrinho limpo:", cartResponse.ok);
            setFinalOrderId(createOrderData.order.id);
          } else {
            console.error("Erro ao processar pedido:", {
              status: processResponse.status,
              statusText: processResponse.statusText,
              data: processData,
            });
          }
        } else {
          console.error("Erro ao criar pedido:", {
            status: createOrderResponse.status,
            statusText: createOrderResponse.statusText,
            data: createOrderData,
          });
        }
        return;
      }

      console.log("Processando pedido existente:", orderId);

      const response = await fetch("/api/order/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: parseInt(orderId) }),
      });

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (response.ok) {
        console.log("Pedido processado com sucesso, limpando carrinho...");
        const cartResponse = await fetch("/api/cart/clear", { method: "POST" });
        console.log("Carrinho limpo:", cartResponse.ok);
        setFinalOrderId(parseInt(orderId));
      } else {
        console.error("Erro ao processar pedido:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });
      }
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
    }
  };

  useEffect(() => {
    if (paymentStatus === "success" && processing) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            const rawOrderId = searchParams.get("orderId");
            const orderIdParam =
              rawOrderId && /^\d+$/.test(rawOrderId)
                ? parseInt(rawOrderId)
                : null;
            const idToUse = finalOrderId ?? orderIdParam;
            router.push(`/checkout/confirmation?orderId=${idToUse ?? ""}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [paymentStatus, processing, router, searchParams, finalOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verificando pagamento...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-8 text-center">
          {paymentStatus === "success" ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-4">
                Pedido Concluído com Sucesso!
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                Seu pagamento foi aprovado e o pedido está sendo processado.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  Redirecionando para a confirmação do pedido em {countdown}{" "}
                  segundos...
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/">Voltar à Loja</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/minha-conta">Ver Meus Pedidos</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-500 text-3xl">×</span>
              </div>
              <h1 className="text-3xl font-bold text-red-600 mb-4">
                Erro no Pagamento
              </h1>
              <p className="text-gray-600 mb-6 text-lg">
                Houve um problema com seu pagamento. Tente novamente.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/checkout">Tentar Novamente</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Voltar à Loja</Link>
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
