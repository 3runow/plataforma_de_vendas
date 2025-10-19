"use client";

import { useState, useEffect } from "react";
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
import MercadoPagoPayment from "./components/mercadopago-payment";

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
  const [useMercadoPago, setUseMercadoPago] = useState(false);

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
  });

  // Formulário de pagamento (atualizado para usar mês e ano separados)
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
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
  const isPersonalDataComplete = () => {
    return (
      formData.name.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.cpf.length === 14 &&
      formData.phone.length === 15
    );
  };

  const isAddressComplete = () => {
    return (
      addressData.cep.length === 9 &&
      addressData.street.trim() !== "" &&
      addressData.number.trim() !== "" &&
      addressData.neighborhood.trim() !== "" &&
      addressData.city.trim() !== "" &&
      addressData.state.length === 2 &&
      selectedShipping !== null
    );
  };

  const isPaymentComplete = () => {
    return (
      paymentData.cardName.trim() !== "" &&
      paymentData.cardNumber.length === 19 &&
      paymentData.expiryMonth !== "" &&
      paymentData.expiryYear !== "" &&
      paymentData.cvv.length >= 3
    );
  };

  // Avança automaticamente para a próxima seção quando completa
  useEffect(() => {
    if (isPersonalDataComplete() && openSection === "personal-data") {
      setTimeout(() => setOpenSection("address"), 300);
    }
  }, [formData, openSection, isPersonalDataComplete]);

  useEffect(() => {
    if (isAddressComplete() && openSection === "address") {
      setTimeout(() => setOpenSection("payment"), 300);
    }
  }, [addressData, openSection, isAddressComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos de data
    if (!paymentData.expiryMonth || !paymentData.expiryYear) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha a data de validade do cartão.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulação de processamento de pedido
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Você receberá um e-mail com os detalhes do pedido.",
      });

      clearCart();
      router.push("/");
    } catch {
      toast({
        title: "Erro ao processar pedido",
        description: "Tente novamente mais tarde.",
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
                onValueChange={setOpenSection}
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
                          isAddressComplete()
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isAddressComplete() ? "✓" : "2"}
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold">
                          Endereço de Entrega
                        </h3>
                        {isAddressComplete() && (
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
                        {isPaymentComplete() && !useMercadoPago && (
                          <p className="text-sm text-muted-foreground">
                            Cartão •••• {paymentData.cardNumber.slice(-4)}
                          </p>
                        )}
                        {useMercadoPago && (
                          <p className="text-sm text-muted-foreground">
                            Mercado Pago
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    {/* Opção de escolher método de pagamento */}
                    <div className="mb-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useMercadoPago}
                          onChange={(e) => setUseMercadoPago(e.target.checked)}
                          className="rounded"
                        />
                        <span>Pagar com Mercado Pago</span>
                      </label>
                    </div>

                    {useMercadoPago ? (
                      <MercadoPagoPayment
                        amount={total}
                        onPaymentSuccessAction={(data) => {
                          console.log("Pagamento aprovado:", data);
                          toast({
                            title: "Pagamento aprovado!",
                            description: "Seu pedido foi confirmado.",
                          });
                        }}
                        onPaymentErrorAction={(error) => {
                          toast({
                            title: "Erro no pagamento",
                            description: error,
                            variant: "destructive",
                          });
                        }}
                      />
                    ) : (
                      <PaymentForm
                        paymentData={paymentData}
                        onPaymentDataChangeAction={setPaymentData}
                      />
                    )}
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
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
