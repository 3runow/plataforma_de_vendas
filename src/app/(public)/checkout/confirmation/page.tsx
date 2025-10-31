"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Package, Truck, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";

interface OrderData {
  id: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      imageUrl?: string;
    };
  }>;
  address: {
    recipientName: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCleared, setCartCleared] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  // Declara as funções ANTES dos useEffects que as utilizam
  const fetchOrder = useCallback(async (orderId: number) => {
    try {
      const response = await fetch(`/api/order/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        // Só atualiza se o order mudou ou se o status mudou para approved
        if (!order || order.paymentStatus !== data.order?.paymentStatus || order.status !== data.order?.status) {
          setOrder(data.order);
          
          // Se o pagamento foi aprovado, limpa o carrinho uma vez
          if (data.order?.paymentStatus === "approved" && !cartCleared) {
            try {
              const cartResponse = await fetch("/api/cart/clear", {
                method: "POST",
              });
              if (cartResponse.ok) {
                console.log("🛒 Carrinho limpo no banco de dados (via polling)");
              }
              clearCart();
              setCartCleared(true);
              console.log("🛒 Carrinho limpo no frontend (localStorage via polling)");
            } catch (error) {
              console.error("Erro ao limpar carrinho:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
    } finally {
      setLoading(false);
    }
  }, [order, cartCleared, clearCart]);

  const verifyAndUpdatePayment = useCallback(async (paymentIntentId: string, orderId: number) => {
    // Evita verificar múltiplas vezes
    if (paymentVerified) {
      return;
    }
    
    try {
      console.log("🔍 Verificando status do pagamento:", paymentIntentId);
      setPaymentVerified(true);
      
      const response = await fetch("/api/stripe/verify-and-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          orderId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.order && data.order.paymentStatus === "approved") {
          console.log("✅ Pagamento verificado e pedido atualizado");
          setOrder(data.order);
          
          // Limpa o carrinho apenas uma vez quando o pagamento é confirmado
          if (!cartCleared) {
            try {
              // Limpa o carrinho no banco de dados
              const cartResponse = await fetch("/api/cart/clear", {
                method: "POST",
              });
              if (cartResponse.ok) {
                console.log("🛒 Carrinho limpo no banco de dados");
              }
              // Limpa o carrinho no localStorage e no contexto React
              clearCart();
              setCartCleared(true);
              console.log("🛒 Carrinho limpo no frontend (localStorage)");
            } catch (error) {
              console.error("Erro ao limpar carrinho:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      setPaymentVerified(false); // Permite tentar novamente em caso de erro
    }
  }, [clearCart, cartCleared, paymentVerified]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (orderId) {
      fetchOrder(parseInt(orderId));
    } else {
      setLoading(false);
    }
  }, [searchParams, fetchOrder]);
  
  // Verifica e atualiza o pagamento quando houver payment_intent e redirect_status=succeeded
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");
    
    if (orderId && paymentIntent && redirectStatus === "succeeded") {
      // Aguarda um pouco para garantir que o order foi carregado
      const timer = setTimeout(() => {
        verifyAndUpdatePayment(paymentIntent, parseInt(orderId));
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, verifyAndUpdatePayment]);

  // Verifica periodicamente o status se houver payment_intent nos params e o pagamento ainda estiver pendente
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    const paymentIntent = searchParams.get("payment_intent");
    
    // Para o polling se o pagamento já foi aprovado
    if (order && order.paymentStatus === "approved") {
      return;
    }
    
    // Não faz polling se já verificou o pagamento e foi aprovado
    if (paymentVerified && order?.paymentStatus === "approved") {
      return;
    }
    
    // Não faz polling se não há payment_intent ou se já verificou
    if (!paymentIntent || paymentVerified) {
      return;
    }
    
    if (order && orderId && order.paymentStatus !== "approved") {
      // Aguarda um pouco para dar tempo do webhook processar, depois verifica periodicamente
      const initialDelay = setTimeout(() => {
        fetchOrder(parseInt(orderId));
      }, 2000); // Primeira verificação após 2 segundos
      
      // Verifica periodicamente a cada 3 segundos, máximo 3 vezes (9 segundos)
      let attempts = 0;
      const maxAttempts = 3;
      
      const interval = setInterval(() => {
        attempts++;
        fetchOrder(parseInt(orderId));
        
        // Para após máximo de tentativas
        if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 3000);
      
      return () => {
        clearTimeout(initialDelay);
        clearInterval(interval);
      };
    }
  }, [order, searchParams, fetchOrder, paymentVerified]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "processing":
        return "Processando";
      case "shipped":
        return "Enviado";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return "Pendente";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando confirmação do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pedido não encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            Não foi possível encontrar o pedido solicitado.
          </p>
          <Link href="/">
            <Button>Voltar para a loja</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Cabeçalho de sucesso */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pedido Confirmado!
          </h1>
          <p className="text-gray-600">
            Seu pedido foi processado com sucesso e está sendo preparado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalhes do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número do Pedido:</span>
                  <span className="font-semibold">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pagamento:</span>
                  <Badge className="bg-green-500">
                    {order.paymentStatus === "approved"
                      ? "Aprovado"
                      : "Pendente"}
                  </Badge>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{order.address.recipientName}</p>
                  <p>
                    {order.address.street}, {order.address.number}
                  </p>
                  <p>{order.address.neighborhood}</p>
                  <p>
                    {order.address.city} - {order.address.state}
                  </p>
                  <p>CEP: {order.address.cep}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itens do Pedido */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    // Agrupar itens por produto para evitar duplicatas
                    const groupedItems = order.items.reduce(
                      (acc, item) => {
                        const productId = item.product.id;
                        if (acc[productId]) {
                          acc[productId].quantity += item.quantity;
                        } else {
                          acc[productId] = { ...item };
                        }
                        return acc;
                      },
                      {} as Record<number, (typeof order.items)[0]>
                    );

                    return Object.values(groupedItems).map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        {item.product.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            R$ {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Próximos Passos */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Preparação do pedido</p>
                      <p className="text-sm text-gray-600">
                        Seus itens estão sendo preparados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Envio</p>
                      <p className="text-sm text-gray-600">
                        Você receberá o código de rastreamento
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-gray-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Entrega</p>
                      <p className="text-sm text-gray-600">
                        Receba seu pedido em casa
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/minha-conta" className="flex-1">
            <Button variant="outline" className="w-full">
              Ver Meus Pedidos
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full">Continuar Comprando</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center">
              <p className="text-gray-600">
                Carregando informações do pedido...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
