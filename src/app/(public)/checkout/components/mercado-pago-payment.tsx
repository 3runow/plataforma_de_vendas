"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import Image from "next/image";
import { initMercadoPago } from "@mercadopago/sdk-react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  QrCode,
  Copy,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface PaymentData {
  amount: number;
  paymentMethod: string;
  paymentId?: string;
  status?: string;
  orderId?: number;
}

type CardFormData = {
  payment_method_id: string;
  token: string;
  issuer_id?: string | number;
  installments?: number | string;
};

interface MercadoPagoPaymentProps {
  amount: number;
  paymentMethod: "credit_card" | "pix" | "boleto";
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  orderId?: number;
  ensureOrder?: () => Promise<number>;
  onPaymentSuccessAction: (paymentData: PaymentData) => void;
  onPaymentErrorAction: (error: string) => void;
}

export interface MercadoPagoPaymentRef {
  processPayment: () => Promise<void>;
}

interface PixData {
  paymentId?: string;
  status?: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  ticketUrl?: string | null;
}

const MERCADO_PAGO_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "";

const CardPaymentBrick = dynamic(
  () => import("@mercadopago/sdk-react").then((mod) => mod.CardPayment),
  { ssr: false }
);

function splitName(fullName: string) {
  if (!fullName) {
    return { firstName: "Cliente", lastName: "" };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

const MercadoPagoPayment = forwardRef<
MercadoPagoPaymentRef,
MercadoPagoPaymentProps
>(function MercadoPagoPayment(
  {
    amount,
    paymentMethod,
    payerEmail,
    payerName,
    payerCpf,
    orderId,
    ensureOrder,
    onPaymentSuccessAction,
    onPaymentErrorAction,
  },
  ref,
) {
  const [selectedMethod, setSelectedMethod] =
    useState<MercadoPagoPaymentProps["paymentMethod"]>(
      paymentMethod === "pix" ? "pix" : "credit_card",
    );
  const [payerNameInput, setPayerNameInput] = useState(payerName);
  const [payerCpfInput, setPayerCpfInput] = useState(payerCpf);
  const [mpReady, setMpReady] = useState(false);
  const [cardFormReady, setCardFormReady] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [pixInterval, setPixInterval] = useState<NodeJS.Timeout | null>(null);
  const [resolvedOrderId, setResolvedOrderId] = useState<number | undefined>(
    orderId,
  );

  useEffect(() => {
    setResolvedOrderId(orderId);
  }, [orderId]);

  useEffect(() => {
    if (!MERCADO_PAGO_PUBLIC_KEY) {
      return;
    }

    initMercadoPago(MERCADO_PAGO_PUBLIC_KEY, { locale: "pt-BR" });
    setMpReady(true);
  }, []);

  useEffect(() => {
    return () => {
      if (pixInterval) {
        clearInterval(pixInterval);
      }
    };
  }, [pixInterval]);

  useEffect(() => {
    setInfoMessage(null);
  }, [selectedMethod]);

  const parseJsonResponse = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || "Resposta invalida do servidor" };
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const showError = (message: string) => {
    onPaymentErrorAction(message);
    setPaymentProcessed(false);
  };

  const stopPixPolling = () => {
    if (pixInterval) {
      clearInterval(pixInterval);
      setPixInterval(null);
    }
  };

  const handlePixStatus = async (paymentId: string) => {
    try {
      const response = await fetch("/api/mercado-pago/payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          orderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar status do PIX");
      }

      setPixData((prev) => ({
        ...(prev || {}),
        status: data.status,
      }));

      if (data.status === "approved") {
        stopPixPolling();
        setPaymentProcessed(true);
        onPaymentSuccessAction({
          amount,
          paymentMethod: "pix",
          paymentId: String(data.paymentId),
          status: data.status,
          orderId: data.orderId || orderId,
        });
      }
    } catch (error) {
      console.error("Erro ao consultar status do PIX:", error);
    }
  };

  const startPixPolling = (paymentId: string) => {
    stopPixPolling();
    const interval = setInterval(() => {
      void handlePixStatus(paymentId);
    }, 5000);
    setPixInterval(interval);
  };

  const handlePixPayment = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const cpfDigits = payerCpfInput.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      if (silent) {
        setInfoMessage("Informe um CPF valido para liberar o PIX.");
      } else {
        showError("Informe um CPF valido para gerar o pagamento.");
      }
      return;
    }

    let finalOrderId = resolvedOrderId;

    if (!finalOrderId && ensureOrder) {
      try {
        finalOrderId = await ensureOrder();
      } catch (err) {
        if (silent) {
          setInfoMessage(
            err instanceof Error
              ? err.message
              : "Conclua o endereco e o frete para gerar o PIX.",
          );
        } else {
          showError(
            err instanceof Error
              ? err.message
              : "Crie o pedido antes de gerar o pagamento.",
          );
        }
        return;
      }
    }

    if (!finalOrderId) {
      if (silent) {
        setInfoMessage("Crie o pedido antes de gerar o pagamento.");
      } else {
        showError("Crie o pedido antes de gerar o pagamento.");
      }
      return;
    }

    setResolvedOrderId(finalOrderId);
    setPixLoading(true);
    setInfoMessage(null);

    try {
      const { firstName, lastName } = splitName(payerNameInput);
      const response = await fetch("/api/mercado-pago/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: finalOrderId,
          transactionAmount: Number(amount.toFixed(2)),
          paymentMethodId: "pix",
          payer: {
            email: payerEmail,
            firstName,
            lastName,
            identification: {
              type: "CPF",
              number: cpfDigits,
            },
          },
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Erro ao gerar PIX",
        );
      }

      const nextPixData: PixData = {
        paymentId: data.id ? String(data.id) : undefined,
        status: data.status,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        ticketUrl: data.ticketUrl,
      };

      setPixData(nextPixData);
      setInfoMessage(
        "Pagamento PIX gerado. Aguarde a confirmacao apos pagar pelo seu banco.",
      );

      if (nextPixData.paymentId) {
        startPixPolling(nextPixData.paymentId);
      }
    } catch (error) {
      console.error("Erro ao criar PIX:", error);
      const fallbackMessage =
        error instanceof Error ? error.message : "Erro ao gerar pagamento PIX";
      if (silent) {
        setInfoMessage(fallbackMessage);
      } else {
        showError(fallbackMessage);
      }
    } finally {
      setPixLoading(false);
    }
  };

  const handleCardSubmit = async (formData: CardFormData) => {
    const cpfDigits = payerCpfInput.replace(/\D/g, "");
    if (cpfDigits.length !== 11) {
      showError("Informe um CPF valido para pagar.");
      throw new Error("CPF invalido");
    }

    const finalOrderId =
      resolvedOrderId ??
      (await (ensureOrder
        ? ensureOrder().catch((err) => {
            showError(
              err instanceof Error
                ? err.message
                : "Crie o pedido antes de pagar.",
            );
            return undefined;
          })
        : Promise.resolve(undefined)));

    if (!finalOrderId) {
      showError("Crie o pedido antes de pagar.");
      throw new Error("Pedido inexistente");
    }

    setResolvedOrderId(finalOrderId);

    const installments =
      typeof formData.installments === "string"
        ? parseInt(formData.installments, 10)
        : formData.installments;

    setCardLoading(true);
    setInfoMessage(null);

    try {
      const { firstName, lastName } = splitName(payerNameInput);
      const response = await fetch("/api/mercado-pago/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId: finalOrderId,
          transactionAmount: Number(amount.toFixed(2)),
          paymentMethodId: formData.payment_method_id,
          token: formData.token,
          issuerId: formData.issuer_id,
          installments: installments && Number.isFinite(installments)
            ? installments
            : undefined,
          payer: {
            email: payerEmail,
            firstName,
            lastName,
            identification: {
              type: "CPF",
              number: cpfDigits,
            },
          },
        }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Erro ao processar pagamento",
        );
      }

      setPaymentProcessed(true);
      setInfoMessage(
        data.status === "approved"
          ? "Pagamento aprovado. Redirecionando..."
          : "Pagamento em analise. Vamos atualizar o pedido quando o banco confirmar.",
      );

      onPaymentSuccessAction({
        amount,
        paymentMethod: "credit_card",
        paymentId: data.id ? String(data.id) : undefined,
        status: data.status,
        orderId: data.orderId || finalOrderId,
      });

      return data;
    } catch (error) {
      console.error("Erro ao processar cartao:", error);
      const message =
        error instanceof Error ? error.message : "Erro ao processar pagamento";
      showError(message);
      throw error;
    } finally {
      setCardLoading(false);
    }
  };

  const handleMethodChange = (methodId: "credit_card" | "pix") => {
    setSelectedMethod(methodId);
    setCardFormReady(false);

    if (methodId === "pix") {
      if (!pixData) {
        void handlePixPayment({ silent: true });
      }
    } else {
      stopPixPolling();
    }
  };

  const handlePixRegenerate = () => {
    stopPixPolling();
    setPixData(null);
    void handlePixPayment();
  };

  useImperativeHandle(ref, () => ({
      processPayment: async () => {
        if (selectedMethod === "pix" && pixData?.paymentId) {
          await handlePixStatus(pixData.paymentId);
        }
      },
  }));

  if (!MERCADO_PAGO_PUBLIC_KEY) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold mb-2">Configuracao necessaria</h3>
          <p className="text-sm mb-4">
            Defina a variavel NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY no seu .env.
          </p>
        </div>
      </Card>
    );
  }

  const paymentMethods = [
    {
      id: "credit_card" as const,
      name: "Cartao de credito",
      icon: CreditCard,
      description: "Pague no cartao em ate 12x sem sair daqui",
      badge: "Parcelamento disponivel",
    },
    {
      id: "pix" as const,
      name: "PIX instantaneo",
      icon: QrCode,
      description: "Geramos o QR Code na tela e confirmamos automaticamente",
      badge: "Confirmacao em segundos",
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Metodo de pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleMethodChange(method.id)}
                  aria-pressed={isSelected}
                  className={`group relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-white/50 bg-white/10"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tracking-tight">
                        {method.name}
                      </span>
                      {method.badge && (
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wide ${
                            isSelected
                              ? "text-emerald-200"
                              : "text-emerald-700"
                          }`}
                        >
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm leading-snug ${
                        isSelected ? "text-white/80" : "text-gray-600"
                      }`}
                    >
                      {method.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-4 flex items-center gap-1 text-xs font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4" /> Selecionado
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome completo *
            </label>
            <Input
              value={payerNameInput}
              onChange={(e) => setPayerNameInput(e.target.value)}
              placeholder="JOAO SILVA"
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

        {selectedMethod === "credit_card" && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-1 border-b border-gray-100 px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                Pagamento seguro
              </p>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Detalhes do cartao
                  </h4>
                  <p className="text-sm text-gray-500">
                    Seus dados sao criptografados e enviados direto para o Mercado Pago.
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-full bg-gray-900/5 px-3 py-1 text-xs font-semibold text-gray-700">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Conexao protegida
                </div>
              </div>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              {(!mpReady || !cardFormReady) && (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparando o formulario seguro...
                </div>
              )}

              {mpReady && (
                <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 shadow-inner">
                  <CardPaymentBrick
                    id="checkout-card-brick"
                    locale="pt-BR"
                    initialization={{
                      amount: Number(amount.toFixed(2)),
                      payer: {
                        email: payerEmail,
                        identification: {
                          type: "CPF",
                          number: payerCpfInput.replace(/\D/g, ""),
                        },
                      },
                    }}
                    customization={{
                      paymentMethods: {
                        types: {
                          included: ["credit_card", "debit_card"],
                        },
                      },
                    }}
                    onReady={() => setCardFormReady(true)}
                    onSubmit={async (formData: CardFormData) => {
                      await handleCardSubmit({
                        payment_method_id: formData.payment_method_id,
                        token: formData.token,
                        issuer_id: formData.issuer_id,
                        installments: formData.installments,
                      });
                    }}
                    onError={(error: unknown) => {
                      const message =
                        typeof error === "string"
                          ? error
                          : error instanceof Error
                            ? error.message
                            : "Erro ao inicializar o pagamento";
                      showError(message);
                    }}
                  />
                </div>
              )}

              {cardLoading && (
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando pagamento...
                </div>
              )}
            </div>
          </div>
        )}

        {selectedMethod === "pix" && (
          <div className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Pagamento instantaneo
                </p>
                <h4 className="text-xl font-bold text-emerald-900">
                  Mostramos o QR Code aqui mesmo
                </h4>
                <p className="text-sm text-emerald-800">
                  Escaneie pelo app do seu banco ou copie o codigo. Assim que o banco aprovar, atualizamos o pedido automaticamente.
                </p>
              </div>
              {pixData && (
                <Button variant="outline" size="sm" onClick={handlePixRegenerate}>
                  Gerar novo codigo
                </Button>
              )}
            </div>

            {!pixData && (
              <Button
                type="button"
                onClick={() => handlePixPayment()}
                disabled={pixLoading}
                className="h-14 w-full text-base"
              >
                {pixLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando QR Code PIX...
                  </div>
                ) : (
                  `Gerar PIX de R$ ${amount.toFixed(2)}`
                )}
              </Button>
            )}

            {pixLoading && (
              <p className="text-sm text-emerald-700">
                Conectando ao Mercado Pago. Isso leva apenas alguns segundos…
              </p>
            )}

            {pixData?.qrCodeBase64 && (
              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <div className="rounded-2xl border border-white/60 bg-white p-4 text-center shadow-sm">
                  <div className="flex flex-col items-center space-y-2">
                    <QrCode className="h-8 w-8 text-emerald-600" />
                    <p className="text-sm font-semibold text-gray-800">
                      Escaneie com o celular
                    </p>
                  </div>
                  <div className="mt-4 inline-flex rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <Image
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code PIX"
                      width={220}
                      height={220}
                      className="h-56 w-56"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {pixData.qrCode && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <p className="text-sm font-semibold text-gray-700">
                        Codigo copia e cola
                      </p>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-xs text-gray-700">
                        <span className="break-all">{pixData.qrCode}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0"
                          onClick={() => void navigator.clipboard.writeText(pixData.qrCode || "")}
                          aria-label="Copiar codigo PIX"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {pixData.ticketUrl && (
                    <a
                      href={pixData.ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-emerald-700 underline"
                    >
                      Abrir a versao do QR Code no Mercado Pago
                    </a>
                  )}

                  {pixData.status && (
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-emerald-800">
                      Status: <span className="font-semibold uppercase">{pixData.status}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {infoMessage && (
          <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md p-3">
            {infoMessage}
          </div>
        )}

        {paymentProcessed && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Pagamento recebido. Pode prosseguir.
          </div>
        )}
      </div>
    </Card>
  );
});

MercadoPagoPayment.displayName = "MercadoPagoPayment";

export default MercadoPagoPayment;
