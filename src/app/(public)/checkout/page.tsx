"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { ChevronLeft, Lock } from "lucide-react";
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
import OrderSummary from "./components/order-summary";
import ShippingSelector from "./components/shipping-selector";
import MercadoPagoPayment from "./components/mercado-pago-payment";
import AuthModal from "@/components/auth-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [openSection, setOpenSection] = useState<string>("personal-data");
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [showSaveAddressDialog, setShowSaveAddressDialog] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<
    {
      id: number;
      recipientName: string;
      cep: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      isDefault: boolean;
    }[]
  >([]);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Controla se o usuário já avançou automaticamente (para evitar avanço forçado ao editar)
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState({
    personalData: false,
    address: false,
  });

  // Estado do cupom
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const subtotal = getTotalPrice();
  const shippingPrice = selectedShipping?.price || 0;
  const couponDiscount = appliedCoupon
    ? (subtotal * appliedCoupon.discount) / 100
    : 0;
  const total = subtotal + shippingPrice - couponDiscount;

  // Formulário de dados pessoais
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
  });

  // Formulário de endereço
  const [addressData, setAddressData] = useState<{
    addressName: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    recipientName: string;
  }>({
    addressName: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    recipientName: "",
  });

  // Formulário de pagamento (para validação)
  const [paymentData] = useState({
    paymentMethod: "credit_card",
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cpf: "",
  });
  const ensureOrderCreated = useCallback(async (): Promise<number> => {
    if (currentOrderId) return currentOrderId;

    const digits = (value: string) => value.replace(/\D/g, "");
    const cpfDigits = digits(formData.cpf);
    const phoneDigits = digits(formData.phone);

    const isPersonalComplete =
      formData.name.trim().length >= 2 &&
      formData.email.includes("@") &&
      cpfDigits.length === 11 &&
      phoneDigits.length >= 10;

    if (!isPersonalComplete) {
      const message =
        "Preencha nome, email, CPF e telefone antes de pagar.";
      toast({
        title: "Dados pessoais incompletos",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    }

    const cepValid = addressData.cep.replace(/\D/g, "").length === 8;
    const isComplete =
      cepValid &&
      addressData.street.trim() !== "" &&
      addressData.number.trim() !== "" &&
      addressData.neighborhood.trim() !== "" &&
      addressData.city.trim() !== "" &&
      addressData.state.length === 2 &&
      selectedShipping !== null;

    if (!isComplete) {
      const message = "Preencha endereço e selecione o frete antes de pagar.";
      toast({
        title: "Dados incompletos",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    }

    const recipientName =
      addressData.recipientName || formData.name || "Cliente";

    const addressPayload = {
      ...addressData,
      recipientName,
      cep: addressData.cep.replace(/\D/g, ""),
    };

    try {
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            email: formData.email,
            cpf: cpfDigits,
            phone: phoneDigits,
          },
          address: addressPayload,
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping: selectedShipping,
          total: total,
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderJson = await orderRes.json();
      if (orderJson.success && orderJson.order?.id) {
        setCurrentOrderId(orderJson.order.id);
        return orderJson.order.id as number;
      }

      const details =
        Array.isArray(orderJson.details) && orderJson.details.length > 0
          ? orderJson.details
              .map(
                (d: { path?: string; message?: string }) =>
                  `${d.path || "campo"}: ${d.message || ""}`
              )
              .join("; ")
          : null;

      const message = details || orderJson.error || "Erro ao criar pedido";
      toast({
        title: "Não foi possível criar o pedido",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Tente novamente em instantes.";
      toast({
        title: "Erro ao criar pedido",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    }
  }, [
    addressData,
    appliedCoupon?.code,
    cartItems,
    currentOrderId,
    formData.cpf,
    formData.email,
    formData.name,
    formData.phone,
    selectedShipping,
    toast,
    total,
  ]);

  const checkAuthAndLoadUser = useCallback(async () => {
    try {
      const response = await fetch("/api/user/current");
      if (!response.ok) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      const data = await response.json();

      // Função para formatar CPF (11 dígitos -> 000.000.000-00)
      const formatCpf = (cpf: string) => {
        if (!cpf) return "";
        const digits = cpf.replace(/\D/g, "");
        if (digits.length !== 11) return cpf;
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      };

      // Função para formatar telefone (10-11 dígitos -> (00) 00000-0000)
      const formatPhone = (phone: string) => {
        if (!phone) return "";
        const digits = phone.replace(/\D/g, "");
        if (digits.length === 11) {
          return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (digits.length === 10) {
          return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }
        return phone;
      };

      setFormData({
        name: data.name || "",
        email: data.email || "",
        cpf: formatCpf(data.cpf || ""),
        phone: formatPhone(data.phone || ""),
      });

      const addressesResponse = await fetch("/api/addresses");
      if (addressesResponse.ok) {
        const addresses = await addressesResponse.json();
        setSavedAddresses(addresses);

        if (addresses.length > 0) {
          const defaultAddress =
            addresses.find((addr: { isDefault: boolean }) => addr.isDefault) ||
            addresses[0];
          setSelectedAddressId(defaultAddress.id);
          setAddressData({
            addressName: defaultAddress.recipientName || "",
            cep: defaultAddress.cep || "",
            street: defaultAddress.street || "",
            number: defaultAddress.number || "",
            complement: defaultAddress.complement || "",
            neighborhood: defaultAddress.neighborhood || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            recipientName: defaultAddress.recipientName || "",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuthAndLoadUser();
  }, [checkAuthAndLoadUser]);

  useEffect(() => {
    const handler = () => {
      checkAuthAndLoadUser();
      setShowAuthModal(false);
    };
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, [checkAuthAndLoadUser]);

  // Criar pedido automaticamente ao abrir pagamento, se ainda não existir
  useEffect(() => {
    const autoCreateOrder = async () => {
      if (openSection !== "payment" || currentOrderId) return;
      try {
        await ensureOrderCreated();
      } catch (error) {
        console.error("Erro ao criar pedido automaticamente:", error);
      }
    };

    void autoCreateOrder();
  }, [currentOrderId, ensureOrderCreated, openSection]);

  // Atualizar endereço quando o usuário selecionar um endereço salvo
  useEffect(() => {
    if (useSavedAddress && selectedAddressId && savedAddresses.length > 0) {
      const address = savedAddresses.find(
        (addr) => addr.id === selectedAddressId
      );
      if (address) {
        setAddressData({
          addressName: address.recipientName || "",
          cep: address.cep || "",
          street: address.street || "",
          number: address.number || "",
          complement: address.complement || "",
          neighborhood: address.neighborhood || "",
          city: address.city || "",
          state: address.state || "",
          recipientName: address.recipientName || "",
        });
        setSelectedShipping(null); // Resetar frete quando trocar endereço
      }
    }
  }, [selectedAddressId, useSavedAddress, savedAddresses]);

  

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
    // Aceita CEP com traço (9 caracteres) ou sem traço (8 dígitos)
    const cepValid = addressData.cep.replace(/\D/g, "").length === 8;

    return (
      cepValid &&
      addressData.street.trim() !== "" &&
      addressData.number.trim() !== "" &&
      addressData.neighborhood.trim() !== "" &&
      addressData.city.trim() !== "" &&
      addressData.state.length === 2 &&
      selectedShipping !== null
    );
  }, [addressData, selectedShipping]);

  const isPaymentComplete = () => paymentProcessed;

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

  const handleSaveAddress = async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      const sanitizedCep = addressData.cep.replace(/\D/g, "");
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addressData.addressName || "Endereço Principal",
          recipientName: addressData.recipientName,
          cep: sanitizedCep,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement || null,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          isDefault: true,
        }),
      });

      if (response.ok) {
        toast({
          title: "Endereço salvo!",
          description: "Seu endereço foi salvo com sucesso.",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o endereço.",
        variant: "destructive",
      });
    }
    setShowSaveAddressDialog(false);
  };

  const handleApplyCoupon = (code: string, discount: number) => {
    setAppliedCoupon({ code, discount });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleSavePersonalData = async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch (error) {
      console.error("Erro ao salvar dados pessoais:", error);
    }
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
        if (isAuthenticated) {
          const hasSavedAddress = await fetch("/api/addresses")
            .then((r) => r.json())
            .then((data) => data.length > 0);

          if (!hasSavedAddress && addressData.cep) {
            setShowSaveAddressDialog(true);
          } else {
            clearCart();
            router.push(`/checkout/confirmation?orderId=${currentOrderId}`);
          }
        } else {
          clearCart();
          router.push(`/checkout/confirmation?orderId=${currentOrderId}`);
        }
        return;
      }

      // Cria o pedido (sem reduzir estoque ainda)
      const sanitizedCep = addressData.cep.replace(/\D/g, "");
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: formData,
          address: {
            ...addressData,
            cep: sanitizedCep,
          },
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

  const handleContinueWithoutSaving = () => {
    setShowSaveAddressDialog(false);
    clearCart();
    console.log("📍 Continuando sem salvar, currentOrderId:", currentOrderId);
    if (currentOrderId) {
      window.location.href = `/checkout/confirmation?orderId=${currentOrderId}`;
    } else {
      router.push("/checkout/success-simple");
    }
  };

  const handleSwitchToNewAddress = () => {
    setUseSavedAddress(false);
    setAddressData({
      addressName: "",
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      recipientName: "",
    });
    setSelectedShipping(null);
  };

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

        {isAuthenticated === false && (
          <div className="mb-6 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-primary">
                    Faça login (opcional)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Você pode concluir o pagamento como convidado. Entrar agora apenas salva seus dados automaticamente e libera o acompanhamento imediato.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setShowAuthModal(true)}
              >
                Fazer login
              </Button>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        {cartItems.length === 0 && (
          <div className="mb-8 rounded-lg border border-dashed bg-white p-6 text-center shadow-sm">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              Seu carrinho está vazio.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha seus produtos e volte para finalizar a compra.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/")}>
                Continuar comprando
              </Button>
            </div>
          </div>
        )}

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
                    {/* Seletor de Endereços Salvos */}
                    {savedAddresses.length > 0 && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-sm">
                            Endereços Salvos
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleSwitchToNewAddress}
                          >
                            Inserir Novo
                          </Button>
                        </div>

                        {useSavedAddress && (
                          <select
                            value={selectedAddressId || ""}
                            onChange={(e) =>
                              setSelectedAddressId(Number(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                          >
                            {savedAddresses.map(
                              (address: {
                                id: number;
                                recipientName: string | null;
                                street: string;
                                number: string;
                                isDefault: boolean;
                              }) => (
                                <option key={address.id} value={address.id}>
                                  {address.recipientName || "Sem nome"} -{" "}
                                  {address.street}, {address.number}{" "}
                                  {address.isDefault && "(Padrão)"}
                                </option>
                              )
                            )}
                          </select>
                        )}
                      </div>
                    )}

                    {!useSavedAddress && savedAddresses.length > 0 && (
                      <div className="mb-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUseSavedAddress(true);
                            if (selectedAddressId) {
                              const address = savedAddresses.find(
                                (addr) => addr.id === selectedAddressId
                              );
                              if (address) {
                                setAddressData({
                                  addressName: address.recipientName || "",
                                  cep: address.cep || "",
                                  street: address.street || "",
                                  number: address.number || "",
                                  complement: address.complement || "",
                                  neighborhood: address.neighborhood || "",
                                  city: address.city || "",
                                  state: address.state || "",
                                  recipientName: address.recipientName || "",
                                });
                              }
                            }
                            setSelectedShipping(null);
                          }}
                          className="mb-4"
                        >
                          ← Usar endereço salvo
                        </Button>
                      </div>
                    )}

                    <AddressForm
                      addressData={addressData}
                      onAddressDataChangeAction={(data) => {
                        setAddressData({
                          addressName: data.addressName || "",
                          cep: data.cep,
                          street: data.street,
                          number: data.number,
                          complement: data.complement,
                          neighborhood: data.neighborhood,
                          city: data.city,
                          state: data.state,
                          recipientName: data.recipientName,
                        });
                      }}
                    />

                    {/* Seletor de Frete */}
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
                        recipientName={addressData.recipientName}
                        neighborhood={addressData.neighborhood}
                      />
                    </div>
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
                        {isPaymentComplete() && (
                          <p className="text-sm text-muted-foreground">
                            Mercado Pago
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <MercadoPagoPayment
                      amount={total}
                      ensureOrder={ensureOrderCreated}
                      paymentMethod={
                        paymentData.paymentMethod as
                          | "credit_card"
                          | "pix"
                          | "boleto"
                      }
                      payerEmail={formData.email}
                      payerName={formData.name}
                      payerCpf={formData.cpf}
                      orderId={currentOrderId || undefined}
                      onPaymentSuccessAction={async (data) => {
                        console.log("Pagamento recebido:", data);
                        console.log("currentOrderId:", currentOrderId);
                        console.log("orderId recebido:", data.orderId);

                        setPaymentProcessed(true);

                        await handleSavePersonalData();

                        const finalOrderId = data.orderId || currentOrderId;
                        console.log("Final orderId:", finalOrderId);

                        const approved = data.status === "approved";

                        toast({
                          title: approved
                            ? "Pagamento aprovado!"
                            : "Pagamento registrado",
                          description: approved
                            ? "Redirecionando..."
                            : "Estamos aguardando a confirmacao do pagamento. Voce pode acompanhar os detalhes no pedido.",
                        });

                        clearCart();
                        console.log(
                          "Pagamento concluido. Redirecionando para confirmacao com orderId:",
                          finalOrderId
                        );

                        // Permite mostrar a confirmação mesmo sem login (ex.: cliente já cadastrado que comprou sem autenticar)
                        try {
                          const digits = (value: string) => value.replace(/\D/g, "");
                          sessionStorage.setItem(
                            "checkout:lastEmail",
                            formData.email.trim().toLowerCase()
                          );
                          sessionStorage.setItem(
                            "checkout:lastCpf",
                            digits(formData.cpf)
                          );
                        } catch {
                          // ignore
                        }

                        if (finalOrderId) {
                          window.location.href = `/checkout/confirmation?orderId=${finalOrderId}`;
                        } else {
                          window.location.href = "/";
                        }
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
                couponDiscount={couponDiscount}
                appliedCoupon={appliedCoupon}
                onApplyCouponAction={handleApplyCoupon}
                onRemoveCouponAction={handleRemoveCoupon}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Dialog para salvar endereço */}
      <Dialog
        open={showSaveAddressDialog}
        onOpenChange={setShowSaveAddressDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar endereço?</DialogTitle>
            <DialogDescription>
              Deseja salvar este endereço para facilitar suas próximas compras?
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Nome do Endereço:</p>
              <input
                type="text"
                value={addressData.addressName}
                onChange={(e) =>
                  setAddressData({
                    ...addressData,
                    addressName: e.target.value,
                  })
                }
                placeholder="Ex: Casa, Trabalho"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Endereço:</p>
              <p className="text-sm text-gray-600">
                {addressData.street}, {addressData.number}
                {addressData.complement && ` - ${addressData.complement}`}
                <br />
                {addressData.neighborhood} - {addressData.city}/
                {addressData.state}
                <br />
                CEP: {addressData.cep}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleContinueWithoutSaving}>
              Não, obrigado
            </Button>
            <Button
              onClick={async () => {
                await handleSaveAddress();
                clearCart();
                console.log(
                  "📍 Salvando endereço, currentOrderId:",
                  currentOrderId
                );
                if (currentOrderId) {
                  window.location.href = `/checkout/confirmation?orderId=${currentOrderId}`;
                } else {
                  router.push("/checkout/success-simple");
                }
              }}
            >
              Sim, salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthModal
        open={showAuthModal}
        onOpenChangeAction={setShowAuthModal}
      />
    </div>
  );
}




