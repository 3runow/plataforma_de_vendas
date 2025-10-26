"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PersonalDataForm from "./components/personal-data-form";
import AddressForm from "./components/address-form";
import PaymentForm from "./components/payment-form";
import OrderSummary from "./components/order-summary";
import ShippingSelector from "./components/shipping-selector";
import StripePayment from "./components/stripe-payment";

interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: number;
  deliveryTime: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string>("personal-data");
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [useStripe, setUseStripe] = useState(true);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);

  // Controla se o usuário já avançou automaticamente (para evitar avanço forçado ao editar)
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState({
    personalData: false,
    address: false,
  });

  const subtotal = getTotalPrice();
  const shippingPrice = selectedShipping?.price || 0;
  const total = subtotal + shippingPrice;

  // Formulário de dados pessoais
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
  });

  // Formulário de endereço
  const [addressData, setAddressData] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    recipientName: "",
  });

  // Formulário de pagamento (atualizado para usar mês e ano separados)
  const [paymentData, setPaymentData] = useState({
    paymentMethod: "credit_card",
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cpf: "",
  });

  useEffect(() => {
    // Redireciona se o carrinho estiver vazio
    // Não precisa verificar autenticação aqui pois o middleware já faz isso
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description:
          "Adicione produtos ao carrinho antes de finalizar a compra.",
      });
      router.push("/");
    }
  }, [cartItems, router, toast]);

  // Verifica se uma seção está completa
  const isPersonalDataComplete = useCallback(() => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.cpf.length === 14 &&
      formData.phone.length === 15
    );
  }, [formData]);

  const isAddressComplete = useCallback(() => {
    return (
      addressData.cep.length === 9 &&
      addressData.street.trim() !== "" &&
      addressData.number.trim() !== "" &&
      addressData.neighborhood.trim() !== "" &&
      addressData.city.trim() !== "" &&
      addressData.state.length === 2 &&
      selectedShipping !== null
    );
  }, [addressData, selectedShipping]);

  const isPaymentComplete = () => {
    // Validação para cartão de crédito
    if (paymentData.paymentMethod === "credit_card") {
      return (
        paymentData.cardName.trim() !== "" &&
        paymentData.cardNumber.length === 19 &&
        paymentData.expiryMonth !== "" &&
        paymentData.expiryYear !== "" &&
        paymentData.cvv.length >= 3
      );
    }

    // Validação para PIX e Boleto
    if (
      paymentData.paymentMethod === "pix" ||
      paymentData.paymentMethod === "boleto"
    ) {
      return paymentData.cpf.length === 14;
    }

    return false;
  };

  // Avança automaticamente para a próxima seção quando completa (apenas na primeira vez)
  useEffect(() => {
    if (
      isPersonalDataComplete() &&
      openSection === "personal-data" &&
      !hasAutoAdvanced.personalData
    ) {
      setTimeout(() => {
        setOpenSection("address");
        setHasAutoAdvanced((prev) => ({ ...prev, personalData: true }));
      }, 300);
    }
  }, [
    formData,
    openSection,
    isPersonalDataComplete,
    hasAutoAdvanced.personalData,
  ]);

  // Removido auto-avanço da etapa de endereço para pagamento

  // Handler para quando o usuário clica manualmente para abrir/fechar seções
  const handleSectionChange = (value: string) => {
    setOpenSection(value);
    // Reseta as flags de auto-avanço quando o usuário volta para editar
    if (value === "personal-data") {
      setHasAutoAdvanced({ personalData: false, address: false });
    } else if (value === "address") {
      setHasAutoAdvanced((prev) => ({ ...prev, address: false }));
    }
  };

  // Handler para quando o frete é selecionado
  const handleShippingSelected = () => {
    // Avança para a próxima seção (pagamento)
    setOpenSection("payment");
    setHasAutoAdvanced((prev) => ({ ...prev, address: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Validação do destinatário
    if (!addressData.recipientName || addressData.recipientName.trim() === "") {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha o campo Destinatário.",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o pagamento foi processado
    if (!paymentProcessed) {
      toast({
        title: "Pagamento necessário",
        description: "Por favor, processe o pagamento primeiro.",
        variant: "destructive",
      });
      return;
    }

    e.preventDefault();

    setIsLoading(true);

    try {
      // Se já temos um order_id, significa que o pagamento foi processado
      if (currentOrderId) {
        toast({
          title: "Pedido confirmado!",
          description: "Seu pedido foi processado com sucesso.",
        });

        clearCart();
        router.push(`/checkout/confirmation?orderId=${currentOrderId}`);
        return;
      }

      // Cria o pedido (sem reduzir estoque ainda)
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addressData,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping: selectedShipping,
          total: getTotalPrice() + (selectedShipping?.price || 0),
        }),
      });
      const orderJson = await orderRes.json();
      if (!orderJson.success || !orderJson.order?.id) {
        throw new Error(orderJson.error || "Erro ao criar pedido");
      }

      // Salva o order_id para usar no pagamento
      setCurrentOrderId(orderJson.order.id);

      toast({
        title: "Pedido criado!",
        description: "Agora processe o pagamento para confirmar.",
      });
    } catch (err) {
      toast({
        title: "Erro ao processar pedido",
        description:
          err instanceof Error ? err.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Não renderiza nada se carrinho vazio (middleware já verifica autenticação)
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>

        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Formulários com Accordion */}
            <div className="lg:col-span-2">
              <Accordion
                type="single"
                collapsible
                value={openSection}
                onValueChange={handleSectionChange}
                className="space-y-4"
              >
                {/* Dados Pessoais */}
                <AccordionItem
                  value="personal-data"
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isPersonalDataComplete()
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isPersonalDataComplete() ? "✓" : "1"}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">
                          Dados Pessoais
                        </h3>
                        {isPersonalDataComplete() && (
                          <p className="text-sm text-muted-foreground">
                            {formData.name} • {formData.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <PersonalDataForm
                      formData={formData}
                      onFormDataChangeAction={setFormData}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Endereço de Entrega */}
                <AccordionItem value="address" className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          addressData.cep.length === 9 &&
                          addressData.street.trim() !== "" &&
                          addressData.number.trim() !== "" &&
                          addressData.neighborhood.trim() !== "" &&
                          addressData.city.trim() !== "" &&
                          addressData.state.length === 2 &&
                          selectedShipping !== null
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {addressData.cep.length === 9 &&
                        addressData.street.trim() !== "" &&
                        addressData.number.trim() !== "" &&
                        addressData.neighborhood.trim() !== "" &&
                        addressData.city.trim() !== "" &&
                        addressData.state.length === 2 &&
                        selectedShipping !== null
                          ? "✓"
                          : "2"}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">
                          Endereço de Entrega
                        </h3>
                        {addressData.cep.length === 9 &&
                          addressData.street.trim() !== "" &&
                          addressData.number.trim() !== "" &&
                          addressData.neighborhood.trim() !== "" &&
                          addressData.city.trim() !== "" &&
                          addressData.state.length === 2 &&
                          selectedShipping !== null && (
                            <p className="text-sm text-muted-foreground">
                              {addressData.street}, {addressData.number} •{" "}
                              {addressData.city}/{addressData.state}
                            </p>
                          )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <AddressForm
                      addressData={addressData}
                      onAddressDataChangeAction={setAddressData}
                    />

                    {/* Seletor de Frete */}
                    {addressData.cep.length === 9 && (
                      <div className="mt-6">
                        <ShippingSelector
                          fromCep="01310-100"
                          toCep={addressData.cep}
                          products={cartItems.map((item) => ({
                            weight: 0.3,
                            width: 11,
                            height: 17,
                            length: 11,
                            quantity: item.quantity,
                            insurance_value: item.price * item.quantity,
                          }))}
                          onSelectShippingAction={setSelectedShipping}
                          selectedShipping={selectedShipping}
                          onShippingSelected={handleShippingSelected}
                        />
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Pagamento */}
                <AccordionItem value="payment" className="border rounded-lg">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isPaymentComplete()
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isPaymentComplete() ? "✓" : "3"}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">Pagamento</h3>
                        {isPaymentComplete() && !useStripe && (
                          <p className="text-sm text-muted-foreground">
                            Cartão •••• {paymentData.cardNumber.slice(-4)}
                          </p>
                        )}
                        {useStripe && (
                          <p className="text-sm text-muted-foreground">
                            Stripe
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <StripePayment
                      amount={total}
                      paymentMethod={
                        paymentData.paymentMethod as
                          | "credit_card"
                          | "pix"
                          | "boleto"
                      }
                      payerEmail={formData.email}
                      payerName={formData.name}
                      payerCpf={paymentData.cpf || formData.cpf}
                      orderId={currentOrderId || undefined}
                      onPaymentSuccessAction={(data) => {
                        console.log("Pagamento aprovado:", data);
                        setPaymentProcessed(true);
                        toast({
                          title: "Pagamento aprovado!",
                          description: "Redirecionando para confirmação...",
                        });

                        // Redireciona para a página de sucesso simples
                        setTimeout(() => {
                          router.push("/checkout/success-simple");
                        }, 1000);
                      }}
                      onPaymentErrorAction={(error) => {
                        setPaymentProcessed(false);
                        toast({
                          title: "Erro no pagamento",
                          description: error,
                          variant: "destructive",
                        });
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <OrderSummary
                cartItems={cartItems}
                subtotal={subtotal}
                shipping={shippingPrice}
                total={total}
                isLoading={isLoading}
                paymentProcessed={paymentProcessed}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
