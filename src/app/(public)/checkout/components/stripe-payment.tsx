"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, QrCode } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { LucideIcon } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const PIX_ENABLED = false;

interface PaymentData {
  amount: number;
  paymentMethod: string;
  paymentId?: string;
  status?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  [key: string]: unknown;
}

interface StripePaymentProps {
  amount: number;
  paymentMethod: "credit_card" | "pix" | "boleto";
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  orderId?: number;
  onPaymentSuccessAction: (paymentData: PaymentData) => void;
  onPaymentErrorAction: (error: string) => void;
}

export interface StripePaymentRef {
  processPayment: () => Promise<void>;
}

interface CheckoutFormProps {
  amount: number;
  paymentMethod: "credit_card" | "pix" | "boleto";
  orderId?: number;
  paymentIntentId?: string | null;
  onPaymentSuccessAction: (paymentData: PaymentData) => void;
  onPaymentErrorAction: (error: string) => void;
  onPaymentMethodChange?: (method: string) => void;
}

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

interface CheckoutFormPropsWithCallback extends CheckoutFormProps {
  onPaymentMethodChange?: (method: string) => void;
}

function CheckoutForm({
  amount,
  paymentMethod,
  orderId,
  paymentIntentId,
  onPaymentSuccessAction,
  onPaymentErrorAction,
  onPaymentMethodChange,
}: CheckoutFormPropsWithCallback) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      console.log("💳 Iniciando pagamento com orderId:", orderId);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/confirmation?orderId=${orderId}`,
        },
        // For boleto we must redirect to Stripe voucher page; for others, let Stripe decide
        redirect: paymentMethod === "boleto" ? "always" : undefined,
      });

      if (error) {
        console.error("❌ Erro no pagamento:", error);
        onPaymentErrorAction(error.message || "Erro no pagamento");
      } else {
        console.log("✅ Pagamento confirmado pelo Stripe");
        setPaymentCompleted(true);

        // Atualiza o pedido diretamente quando o pagamento é confirmado
        // Usa o paymentIntentId real se disponível, caso contrário tenta extrair do clientSecret
        const finalPaymentId =
          paymentIntentId ||
          (typeof window !== "undefined" &&
          window.location.search.includes("payment_intent=")
            ? new URLSearchParams(window.location.search).get("payment_intent")
            : null);

        if (orderId && finalPaymentId) {
          try {
            console.log(
              "📦 Confirmando pedido com orderId:",
              orderId,
              "paymentIntentId:",
              finalPaymentId
            );
            await fetch("/api/order/confirm-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderId,
                paymentId: finalPaymentId,
                paymentStatus: "approved",
              }),
            });
            console.log("✅ Pedido confirmado com sucesso");
          } catch (err) {
            console.error("❌ Erro ao confirmar pagamento:", err);
          }
        }

        console.log("🔄 Chamando onPaymentSuccessAction com orderId:", orderId);
        onPaymentSuccessAction({
          amount,
          paymentMethod,
          status: "succeeded",
          orderId: orderId,
        });
      }
    } catch (err) {
      console.error("❌ Erro na requisição de pagamento:", err);
      onPaymentErrorAction(
        err instanceof Error ? err.message : "Erro ao processar pagamento"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        onChange={(e) => {
          const methodType = e.value?.type || "";
          if (onPaymentMethodChange) {
            onPaymentMethodChange(methodType);
          }
        }}
      />
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || loading || paymentCompleted}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </div>
        ) : paymentCompleted ? (
          <div className="flex items-center justify-center">
            <svg
              className="w-4 h-4 mr-2 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            Pagamento Aprovado
          </div>
        ) : (
          `Pagar R$ ${amount.toFixed(2)}`
        )}
      </Button>
    </div>
  );
}

const StripePayment = forwardRef<StripePaymentRef, StripePaymentProps>(
  function StripePayment(
    {
      amount,
      paymentMethod,
      payerEmail,
      payerName,
      payerCpf,
      orderId,
      onPaymentSuccessAction,
      onPaymentErrorAction,
    },
    ref
  ) {
    const [clientSecret, setClientSecret] = useState<string>("");
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const normalizedInitialMethod =
      !PIX_ENABLED && paymentMethod === "pix"
        ? "credit_card"
        : paymentMethod;
    const [selectedMethod, setSelectedMethod] =
      useState<StripePaymentProps["paymentMethod"]>(normalizedInitialMethod);
    const [payerNameInput, setPayerNameInput] = useState(payerName);
    const [payerCpfInput, setPayerCpfInput] = useState(payerCpf);
    const [installments, setInstallments] = useState("1");
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [paymentElementMethod, setPaymentElementMethod] =
      useState<string>("");
    const [pixPaymentIntentId, setPixPaymentIntentId] = useState<string>("");
    const [pixQrCode, setPixQrCode] = useState<string>("");
    const [pixLoading, setPixLoading] = useState(false);
    const [pixPollingInterval, setPixPollingInterval] =
      useState<NodeJS.Timeout | null>(null);
    const [pixInstructions, setPixInstructions] = useState<{
      amount?: number;
      qr_code?: string;
      qr_code_text?: string;
    } | null>(null);

    const paymentMethods: PaymentMethodOption[] = [
      {
        id: "credit_card",
        name: "Cartão de Crédito",
        icon: CreditCard,
        description: "Visa, Mastercard, Elo, etc",
      },
      ...(PIX_ENABLED
        ? [
            {
              id: "pix",
              name: "PIX",
              icon: QrCode,
              description: "Pagamento instantâneo",
            },
          ]
        : []),
    ];

    const formatCPF = (value: string) => {
      return value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1");
    };

    const installmentOptions = [
      { value: "1", label: "À vista" },
      { value: "2", label: "2x sem juros" },
      { value: "3", label: "3x sem juros" },
      { value: "6", label: "6x sem juros" },
      { value: "12", label: "12x com juros" },
    ];

    // Função para processar pagamento (usada tanto internamente quanto externamente)
    const processPayment = async () => {
      if (selectedMethod === "credit_card") {
        // Para cartão, criar payment intent se ainda não foi criado
        if (!clientSecret) {
          setLoading(true);
          try {
            const response = await fetch("/api/stripe/create-payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: Math.round(amount * 100),
                currency: "brl",
                paymentMethod: selectedMethod,
                payerEmail,
                payerName: payerNameInput,
                payerCpf: payerCpfInput,
                installments: parseInt(installments),
                orderId: orderId,
              }),
            });

            const data = await response.json();
            if (data.clientSecret) {
              setClientSecret(data.clientSecret);
              if (data.paymentIntentId) {
                setPaymentIntentId(data.paymentIntentId);
              }
            } else {
              onPaymentErrorAction(data.error || "Erro ao criar pagamento");
            }
          } catch (error) {
            onPaymentErrorAction(
              error instanceof Error
                ? error.message
                : "Erro ao processar pagamento"
            );
          } finally {
            setLoading(false);
          }
        }
        // Se já tem clientSecret, o PaymentElement do Stripe já vai processar
        // O usuário precisa preencher os dados do cartão e clicar no botão interno
      } else if (PIX_ENABLED && selectedMethod === "pix") {
        if (!pixQrCode && !pixLoading) {
          setPixLoading(true);
          try {
            const response = await fetch("/api/stripe/create-payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: Math.round(amount * 100),
                currency: "brl",
                paymentMethod: selectedMethod,
                payerEmail,
                payerName: payerNameInput,
                payerCpf: payerCpfInput,
                orderId: orderId,
              }),
            });

            const data = await response.json();
            if (data.error) {
              onPaymentErrorAction(data.error || "Erro ao criar pagamento PIX");
            } else if (data.pixData) {
              setPixPaymentIntentId(data.paymentIntentId);
              setPixQrCode(data.pixData.hosted_voucher_url || "");
              setPixInstructions(data.pixData.instructions);
              setPaymentCompleted(true);

              if (data.isSimulated) {
                console.log(
                  "⚠️ PIX Simulado - Para usar PIX real, habilite na conta Stripe"
                );
              }
            } else {
              onPaymentErrorAction("QR Code PIX não foi gerado");
            }
          } catch (error) {
            onPaymentErrorAction(
              error instanceof Error ? error.message : "Erro ao processar PIX"
            );
          } finally {
            setPixLoading(false);
          }
        }
      } else if (!PIX_ENABLED && selectedMethod === "pix") {
        onPaymentErrorAction("Pagamento via PIX está temporariamente indisponível.");
      }
    };

    // Criar payment intent automaticamente quando método é selecionado
    useEffect(() => {
      const createPaymentIntent = async () => {
        // Só cria se não existe ainda e se os dados básicos estão preenchidos
        // Não precisa de orderId para criar o payment intent
        if (
          payerNameInput.trim() &&
          payerCpfInput.replace(/\D/g, "").length === 11
        ) {
          if (selectedMethod === "credit_card" && !clientSecret && !loading) {
            setLoading(true);
            try {
              const response = await fetch(
                "/api/stripe/create-payment-intent",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount: Math.round(amount * 100),
                    currency: "brl",
                    paymentMethod: selectedMethod,
                    payerEmail,
                    payerName: payerNameInput,
                    payerCpf: payerCpfInput,
                    installments: parseInt(installments),
                    orderId: orderId,
                  }),
                }
              );

              const data = await response.json();
              if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                if (data.paymentIntentId) {
                  setPaymentIntentId(data.paymentIntentId);
                }
              }
            } catch (error) {
              console.error("Erro ao criar payment intent:", error);
            } finally {
              setLoading(false);
            }
          } else if (
            PIX_ENABLED &&
            selectedMethod === "pix" &&
            !pixQrCode &&
            !pixLoading
          ) {
            setPixLoading(true);
            try {
              const response = await fetch(
                "/api/stripe/create-payment-intent",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    amount: Math.round(amount * 100),
                    currency: "brl",
                    paymentMethod: selectedMethod,
                    payerEmail,
                    payerName: payerNameInput,
                    payerCpf: payerCpfInput,
                    orderId: orderId,
                  }),
                }
              );

              const data = await response.json();
              if (data.error) {
                console.error("Erro ao criar PIX:", data.error);
              } else if (data.pixData) {
                setPixPaymentIntentId(data.paymentIntentId);
                setPixQrCode(data.pixData.hosted_voucher_url || "");
                setPixInstructions(data.pixData.instructions);
                setPaymentCompleted(true);

                if (data.isSimulated) {
                  console.log(
                    "⚠️ PIX Simulado - Para usar PIX real, habilite na conta Stripe"
                  );
                }
              }
            } catch (error) {
              console.error("Erro ao criar PIX:", error);
            } finally {
              setPixLoading(false);
            }
          }
        }
      };

      createPaymentIntent();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      selectedMethod,
      payerNameInput,
      payerCpfInput,
      installments,
      amount,
      payerEmail,
    ]);

    // Expor função para componente pai (apenas confirma pagamento se já existir intent)
    useImperativeHandle(ref, () => ({
      processPayment: async () => {
        // Para cartão, se já tem clientSecret, o usuário precisa usar o botão interno
        // Para PIX, já foi gerado automaticamente
        if (selectedMethod === "credit_card") {
          if (!clientSecret) {
            // Se ainda não foi criado, criar agora
            await processPayment();
          }
          // O usuário precisa preencher os dados e usar o botão interno do CheckoutForm
        } else if (PIX_ENABLED && selectedMethod === "pix") {
          // PIX já foi processado automaticamente
          return;
        } else if (!PIX_ENABLED && selectedMethod === "pix") {
          onPaymentErrorAction("Pagamento via PIX está temporariamente indisponível.");
        }
      },
    }));

    // Polling para verificar status do pagamento PIX
    useEffect(() => {
      if (!PIX_ENABLED || !pixPaymentIntentId || paymentCompleted) return;

      const interval = setInterval(async () => {
        try {
          const response = await fetch("/api/stripe/payment-intent-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentIntentId: pixPaymentIntentId }),
          });

          const data = await response.json();

          if (data.status === "succeeded") {
            // Pagamento confirmado
            if (pixPollingInterval) {
              clearInterval(pixPollingInterval);
              setPixPollingInterval(null);
            }

            onPaymentSuccessAction({
              amount,
              paymentMethod: "pix",
              status: "succeeded",
              paymentId: pixPaymentIntentId,
              orderId: orderId || data.orderId,
            });
          }
        } catch (error) {
          console.error("Erro ao verificar status do pagamento:", error);
        }
      }, 5000); // Verifica a cada 5 segundos

      setPixPollingInterval(interval);

      return () => {
        if (pixPollingInterval) {
          clearInterval(pixPollingInterval);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pixPaymentIntentId, paymentCompleted]);

    if (loading) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </Card>
      );
    }

    const options = clientSecret
      ? {
          clientSecret,
          appearance: {
            theme: "stripe" as const,
            variables: {
              colorPrimary: "#2563eb",
            },
          },
        }
      : undefined;

    // Verificar se as variáveis de ambiente estão configuradas
    const isStripeConfigured =
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== "pk_test_51ABC123...";

    if (!isStripeConfigured) {
      return (
        <Card className="p-6">
          <div className="text-center text-red-600">
            <h3 className="text-lg font-semibold mb-2">
              Configuração Necessária
            </h3>
            <p className="text-sm mb-4">
              As chaves do Stripe não estão configuradas. Verifique o arquivo
              .env.local
            </p>
            <p className="text-xs text-gray-500">
              Consulte o arquivo ENVIRONMENT_SETUP.md para instruções
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6">
        <div className="space-y-6">
          {/* Seleção do método de pagamento */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Método de Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() =>
                      setSelectedMethod(
                        method.id as "credit_card" | "pix" | "boleto"
                      )
                    }
                    className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-8 h-8 mb-2" />
                    <span className="font-semibold text-sm">{method.name}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {method.description}
                    </span>
                    {selectedMethod === method.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos de dados do pagador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nome Completo *
              </label>
              <Input
                value={payerNameInput}
                onChange={(e) =>
                  setPayerNameInput(e.target.value.toUpperCase())
                }
                placeholder="JOÃO SILVA"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CPF *</label>
              <Input
                value={payerCpfInput}
                onChange={(e) => setPayerCpfInput(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>
          </div>

          {/* Opções de parcelamento para cartão de crédito (não mostrar se boleto selecionado) */}
          {selectedMethod === "credit_card" &&
            paymentElementMethod !== "boleto" &&
            paymentElementMethod !== "boleto_bancario" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Parcelamento
                </label>
                <Select value={installments} onValueChange={setInstallments}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          {/* Informações específicas por método */}
          {PIX_ENABLED && selectedMethod === "pix" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Como funciona o PIX:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Após confirmar o pedido, um QR Code será gerado</li>
                    <li>Abra o app do seu banco e escaneie o código</li>
                    <li>Confirme o pagamento</li>
                    <li>Pronto! Seu pedido será processado instantaneamente</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Elemento de pagamento do Stripe - usado para cartão (permite escolher boleto dentro) */}
          {selectedMethod === "credit_card" && (
            <>
              {loading && !clientSecret && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Preparando formulário de pagamento...
                  </span>
                </div>
              )}
              {options && (
                <Elements options={options} stripe={stripePromise}>
                  <CheckoutForm
                    amount={amount}
                    paymentMethod={selectedMethod}
                    orderId={orderId}
                    paymentIntentId={paymentIntentId}
                    onPaymentSuccessAction={onPaymentSuccessAction}
                    onPaymentErrorAction={onPaymentErrorAction}
                    onPaymentMethodChange={(method) =>
                      setPaymentElementMethod(method)
                    }
                  />
                </Elements>
              )}
            </>
          )}

          {/* Seção de PIX */}
          {PIX_ENABLED && selectedMethod === "pix" && (
            <div className="space-y-4">
              {pixLoading && !pixQrCode && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Gerando QR Code PIX...
                  </span>
                </div>
              )}
              {/* Display do QR Code PIX */}
              {pixQrCode && (
                <div className="bg-white border-2 border-primary rounded-lg p-6 text-center space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <QrCode className="w-8 h-8 text-primary" />
                    <h3 className="text-lg font-semibold">Pague com PIX</h3>
                    <p className="text-sm text-gray-600">
                      Escaneie o QR Code com o app do seu banco
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                    {pixQrCode.startsWith("https://") ? (
                      <Image
                        src={pixQrCode}
                        alt="QR Code PIX"
                        width={256}
                        height={256}
                        className="w-64 h-64"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                        QR Code indisponível
                      </div>
                    )}
                  </div>

                  {/* Exibe instruções do PIX se disponível */}
                  {pixInstructions && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left space-y-2">
                      <p className="text-xs font-semibold text-gray-700">
                        Instruções para pagamento:
                      </p>
                      {pixInstructions.amount && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Valor:</span> R${" "}
                          {(pixInstructions.amount / 100).toFixed(2)}
                        </p>
                      )}
                      {pixInstructions.qr_code && (
                        <p className="text-xs text-gray-600 break-all">
                          <span className="font-medium">Código PIX:</span>{" "}
                          {pixInstructions.qr_code}
                        </p>
                      )}
                      {pixInstructions.qr_code_text && (
                        <p className="text-xs text-gray-600 break-all">
                          <span className="font-medium">Texto:</span>{" "}
                          {pixInstructions.qr_code_text}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      O QR Code expira em 1 hora. Após o pagamento, o pedido
                      será processado automaticamente.
                    </p>
                  </div>

                  {/* Aviso para PIX simulado */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>⚠️ PIX Simulado:</strong> Este é um QR Code de
                      demonstração. Para usar PIX real, habilite o PIX na sua
                      conta Stripe em:
                      <a
                        href="https://dashboard.stripe.com/account/payments/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline ml-1"
                      >
                        dashboard.stripe.com
                      </a>
                    </p>
                  </div>

                  {/* Botão para simular confirmação do pagamento */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          "/api/stripe/simulate-pix-confirmation",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              paymentIntentId: pixPaymentIntentId,
                            }),
                          }
                        );

                        const data = await response.json();
                        if (data.success) {
                          onPaymentSuccessAction({
                            amount,
                            paymentMethod: "pix",
                            status: "succeeded",
                            paymentId: pixPaymentIntentId,
                            orderId: data.orderId,
                          });
                        } else {
                          onPaymentErrorAction(
                            data.error || "Erro ao simular pagamento"
                          );
                        }
                      } catch (error) {
                        onPaymentErrorAction(
                          error instanceof Error
                            ? error.message
                            : "Erro ao simular pagamento"
                        );
                      }
                    }}
                    className="w-full"
                  >
                    🧪 Simular Confirmação do Pagamento (Teste)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

StripePayment.displayName = "StripePayment";

export default StripePayment;
