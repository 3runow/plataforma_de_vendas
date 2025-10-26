"use client";

import { useEffect, useState } from "react";
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
import { Loader2, CreditCard, QrCode, Barcode } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

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

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: any;
  description: string;
}

function CheckoutForm({
  amount,
  paymentMethod,
  payerEmail,
  payerName,
  payerCpf,
  orderId,
  onPaymentSuccessAction,
  onPaymentErrorAction,
}: StripePaymentProps) {
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
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        onPaymentErrorAction(error.message || "Erro no pagamento");
      } else {
        setPaymentCompleted(true);

        // Atualiza o pedido diretamente quando o pagamento é confirmado
        try {
          await fetch("/api/order/confirm-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderId,
              paymentId: "stripe_payment_confirmed",
              paymentStatus: "approved",
            }),
          });
        } catch (err) {
          console.error("Erro ao confirmar pagamento:", err);
        }

        onPaymentSuccessAction({
          amount,
          paymentMethod,
          status: "succeeded",
          orderId: orderId,
        });
      }
    } catch (err) {
      onPaymentErrorAction(
        err instanceof Error ? err.message : "Erro ao processar pagamento"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
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

export default function StripePayment({
  amount,
  paymentMethod,
  payerEmail,
  payerName,
  payerCpf,
  orderId,
  onPaymentSuccessAction,
  onPaymentErrorAction,
}: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(paymentMethod);
  const [payerNameInput, setPayerNameInput] = useState(payerName);
  const [payerCpfInput, setPayerCpfInput] = useState(payerCpf);
  const [installments, setInstallments] = useState("1");
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "credit_card",
      name: "Cartão de Crédito",
      icon: CreditCard,
      description: "Visa, Mastercard, Elo, etc",
    },
    {
      id: "pix",
      name: "PIX",
      icon: QrCode,
      description: "Pagamento instantâneo",
    },
    {
      id: "boleto",
      name: "Boleto Bancário",
      icon: Barcode,
      description: "Vencimento em 3 dias úteis",
    },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              onChange={(e) => setPayerNameInput(e.target.value.toUpperCase())}
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

        {/* Opções de parcelamento para cartão de crédito */}
        {selectedMethod === "credit_card" && (
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
        {selectedMethod === "pix" && (
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

        {selectedMethod === "boleto" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Barcode className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Informações importantes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>O boleto vence em 3 dias úteis</li>
                  <li>
                    Após confirmar, você poderá imprimir ou copiar o código de
                    barras
                  </li>
                  <li>
                    O pedido só será processado após a confirmação do pagamento
                  </li>
                  <li>Confirmação em até 2 dias úteis</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Elemento de pagamento do Stripe - apenas para cartão de crédito */}
        {selectedMethod === "credit_card" && options && (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm
              amount={amount}
              paymentMethod={selectedMethod}
              payerEmail={payerEmail}
              payerName={payerNameInput}
              payerCpf={payerCpfInput}
              orderId={orderId}
              onPaymentSuccessAction={onPaymentSuccessAction}
              onPaymentErrorAction={onPaymentErrorAction}
            />
          </Elements>
        )}

        {/* Botão para iniciar pagamento com cartão */}
        {selectedMethod === "credit_card" && !clientSecret && (
          <Button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                const response = await fetch(
                  "/api/stripe/create-payment-intent",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amount: Math.round(amount * 100), // Convert to cents
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
            }}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              `Pagar R$ ${amount.toFixed(2)}`
            )}
          </Button>
        )}

        {/* Botão de pagamento para PIX e Boleto */}
        {(selectedMethod === "pix" || selectedMethod === "boleto") && (
          <Button
            type="button"
            onClick={() => {
              if (!paymentCompleted) {
                setPaymentCompleted(true);
                // Para PIX e Boleto, chamamos diretamente a função de sucesso
                onPaymentSuccessAction({
                  amount,
                  paymentMethod: selectedMethod,
                  status: "pending",
                  payerName: payerNameInput,
                  payerCpf: payerCpfInput,
                });
              }
            }}
            disabled={paymentCompleted}
            className="w-full"
            size="lg"
          >
            {paymentCompleted ? (
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
                {selectedMethod === "pix" ? "PIX Gerado" : "Boleto Gerado"}
              </div>
            ) : selectedMethod === "pix" ? (
              `Gerar PIX R$ ${amount.toFixed(2)}`
            ) : (
              `Gerar Boleto R$ ${amount.toFixed(2)}`
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
