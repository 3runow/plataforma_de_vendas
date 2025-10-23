"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, CreditCard, QrCode, Barcode } from "lucide-react";
import Script from "next/script";

interface MercadoPagoInstance {
  bricks: () => {
    create: (
      type: string,
      id: string,
      options: unknown
    ) => Promise<{ unmount: () => void }>;
  };
}

declare global {
  interface Window {
    MercadoPago: new (
      publicKey: string,
      options?: { locale: string }
    ) => MercadoPagoInstance;
  }
}

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

interface MercadoPagoPaymentProps {
  amount: number;
  paymentMethod: "credit_card" | "pix" | "boleto";
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  onPaymentSuccessAction: (paymentData: PaymentData) => void;
  onPaymentErrorAction: (error: string) => void;
}

export default function MercadoPagoPayment({
  amount,
  paymentMethod,
  payerEmail,
  payerName,
  payerCpf,
  onPaymentSuccessAction,
  onPaymentErrorAction,
}: MercadoPagoPaymentProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brick, setBrick] = useState<{ unmount: () => void } | null>(null);

  useEffect(() => {
    if (sdkLoaded && window.MercadoPago) {
      const publicKey =
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
        "TEST-6dc16094-e309-4bb2-94c3-9cb3608e274f";

      if (!publicKey) {
        console.error("Mercado Pago public key not found");
        return;
      }

      const mercadopago = new window.MercadoPago(publicKey, {
        locale: "pt-BR",
      });

      // Limpa o brick anterior se existir
      if (brick) {
        brick.unmount();
      }

      const initializeBrick = async () => {
        try {
          const bricksBuilder = mercadopago.bricks();

          // Configura o brick de acordo com o método de pagamento
          if (paymentMethod === "credit_card") {
            // Brick de Cartão de Crédito
            const cardPaymentBrick = await bricksBuilder.create(
              "cardPayment",
              "cardPaymentBrick_container",
              {
                initialization: {
                  amount: amount,
                  payer: {
                    email: payerEmail,
                    identification: {
                      type: "CPF",
                      number: payerCpf.replace(/\D/g, ""),
                    },
                  },
                },
                callbacks: {
                  onReady: () => {
                    setLoading(false);
                  },
                  onSubmit: async (formData: PaymentData) => {
                    setLoading(true);
                    try {
                      // Envia para sua API backend processar o pagamento
                      const response = await fetch("/api/payment/process", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          ...formData,
                          paymentMethod: "credit_card",
                          amount,
                          payer: {
                            email: payerEmail,
                            name: payerName,
                            identification: {
                              type: "CPF",
                              number: payerCpf.replace(/\D/g, ""),
                            },
                          },
                        }),
                      });

                      const result = await response.json();

                      if (result.status === "approved") {
                        onPaymentSuccessAction({
                          ...result,
                          paymentMethod: "credit_card",
                        });
                      } else {
                        onPaymentErrorAction(
                          result.statusDetail || "Pagamento não aprovado"
                        );
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
                  },
                  onError: (error: Error) => {
                    onPaymentErrorAction(error.message);
                    setLoading(false);
                  },
                },
              }
            );
            setBrick(cardPaymentBrick);
          } else if (paymentMethod === "pix") {
            // Brick de PIX
            setLoading(true);
            try {
              const response = await fetch("/api/payment/create-pix", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount,
                  payer: {
                    email: payerEmail,
                    name: payerName,
                    identification: {
                      type: "CPF",
                      number: payerCpf.replace(/\D/g, ""),
                    },
                  },
                }),
              });

              const pixData = await response.json();

              if (pixData.qrCode) {
                onPaymentSuccessAction({
                  amount,
                  paymentMethod: "pix",
                  paymentId: pixData.id,
                  status: "pending",
                  qrCode: pixData.qrCode,
                  qrCodeBase64: pixData.qrCodeBase64,
                });
              } else {
                onPaymentErrorAction("Erro ao gerar QR Code PIX");
              }
            } catch (error) {
              onPaymentErrorAction(
                error instanceof Error ? error.message : "Erro ao gerar PIX"
              );
            } finally {
              setLoading(false);
            }
          } else if (paymentMethod === "boleto") {
            // Boleto
            setLoading(true);
            try {
              const response = await fetch("/api/payment/create-boleto", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  amount,
                  payer: {
                    email: payerEmail,
                    name: payerName,
                    identification: {
                      type: "CPF",
                      number: payerCpf.replace(/\D/g, ""),
                    },
                  },
                }),
              });

              const boletoData = await response.json();

              if (boletoData.ticketUrl) {
                onPaymentSuccessAction({
                  amount,
                  paymentMethod: "boleto",
                  paymentId: boletoData.id,
                  status: "pending",
                  ticketUrl: boletoData.ticketUrl,
                });
              } else {
                onPaymentErrorAction("Erro ao gerar boleto");
              }
            } catch (error) {
              onPaymentErrorAction(
                error instanceof Error ? error.message : "Erro ao gerar boleto"
              );
            } finally {
              setLoading(false);
            }
          }
        } catch (error) {
          console.error("Erro ao inicializar brick:", error);
          onPaymentErrorAction(
            error instanceof Error
              ? error.message
              : "Erro ao carregar forma de pagamento"
          );
        }
      };

      initializeBrick();
    }

    return () => {
      if (brick) {
        brick.unmount();
      }
    };
  }, [sdkLoaded, paymentMethod, amount, payerEmail, payerName, payerCpf]);

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case "credit_card":
        return <CreditCard className="w-5 h-5" />;
      case "pix":
        return <QrCode className="w-5 h-5" />;
      case "boleto":
        return <Barcode className="w-5 h-5" />;
    }
  };

  const getPaymentTitle = () => {
    switch (paymentMethod) {
      case "credit_card":
        return "Cartão de Crédito";
      case "pix":
        return "PIX";
      case "boleto":
        return "Boleto Bancário";
    }
  };

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={() => setSdkLoaded(true)}
      />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          {getPaymentIcon()}
          <h3 className="font-semibold">{getPaymentTitle()}</h3>
        </div>

        {!sdkLoaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando Mercado Pago...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Total a pagar:
              </p>
              <p className="text-2xl font-bold">R$ {amount.toFixed(2)}</p>
            </div>

            {paymentMethod === "credit_card" && (
              <div id="cardPaymentBrick_container" className="min-h-[300px]">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "pix" && (
              <div className="text-center py-4">
                {loading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Gerando QR Code PIX...</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique em "Finalizar Compra" para gerar o QR Code PIX
                  </p>
                )}
              </div>
            )}

            {paymentMethod === "boleto" && (
              <div className="text-center py-4">
                {loading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Gerando boleto...</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Clique em "Finalizar Compra" para gerar o boleto
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
