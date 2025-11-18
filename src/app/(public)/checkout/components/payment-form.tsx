"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { CreditCard, Barcode } from "lucide-react";

interface PaymentFormProps {
  paymentData: {
    paymentMethod: string;
    cardNumber: string;
    cardName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cpf: string;
  };
  onPaymentDataChangeAction: (data: {
    paymentMethod: string;
    cardNumber: string;
    cardName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cpf: string;
  }) => void;
}

export default function PaymentForm({
  paymentData,
  onPaymentDataChangeAction,
}: PaymentFormProps) {
  const initialMethod =
    paymentData.paymentMethod === "pix" || !paymentData.paymentMethod
      ? "credit_card"
      : paymentData.paymentMethod;
  const [selectedMethod, setSelectedMethod] = useState(initialMethod);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i);

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})(\d)/, "$1 $2")
      .replace(/(\d{4})\d+?$/, "$1");
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const handleMethodChange = (method: string) => {
    setSelectedMethod(method);
    onPaymentDataChangeAction({
      ...paymentData,
      paymentMethod: method,
    });
  };

  const paymentMethods = [
    {
      id: "credit_card",
      name: "Cartão de Crédito",
      icon: CreditCard,
      description: "Visa, Mastercard, Elo, etc",
    },
    // PIX temporariamente indisponível
    // {
    //   id: "pix",
    //   name: "PIX",
    //   icon: QrCode,
    //   description: "Pagamento instantâneo",
    // },
    {
      id: "boleto",
      name: "Boleto Bancário",
      icon: Barcode,
      description: "Vencimento em 3 dias úteis",
    },
  ];

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Método de Pagamento</FieldLegend>
        <FieldDescription>
          Todas as transações são seguras e criptografadas
        </FieldDescription>

        {/* Seleção do método de pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodChange(method.id)}
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

        {/* Formulário de Cartão de Crédito */}
        {selectedMethod === "credit_card" && (
          <>
            <Field>
              <FieldLabel htmlFor="cardName">Nome no Cartão *</FieldLabel>
              <Input
                id="cardName"
                required
                value={paymentData.cardName}
                onChange={(e) =>
                  onPaymentDataChangeAction({
                    ...paymentData,
                    cardName: e.target.value.toUpperCase(),
                  })
                }
                placeholder="JOÃO SILVA"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cardNumber">Número do Cartão *</FieldLabel>
              <Input
                id="cardNumber"
                required
                value={paymentData.cardNumber}
                onChange={(e) =>
                  onPaymentDataChangeAction({
                    ...paymentData,
                    cardNumber: formatCardNumber(e.target.value),
                  })
                }
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
              <FieldDescription>
                Digite os 16 dígitos do seu cartão
              </FieldDescription>
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="expiryMonth">Mês *</FieldLabel>
                <Select
                  value={paymentData.expiryMonth}
                  onValueChange={(value) =>
                    onPaymentDataChangeAction({
                      ...paymentData,
                      expiryMonth: value,
                    })
                  }
                  required
                >
                  <SelectTrigger id="expiryMonth">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = String(i + 1).padStart(2, "0");
                      return (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="expiryYear">Ano *</FieldLabel>
                <Select
                  value={paymentData.expiryYear}
                  onValueChange={(value) =>
                    onPaymentDataChangeAction({
                      ...paymentData,
                      expiryYear: value,
                    })
                  }
                  required
                >
                  <SelectTrigger id="expiryYear">
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="cvv">CVV *</FieldLabel>
                <Input
                  id="cvv"
                  required
                  value={paymentData.cvv}
                  onChange={(e) =>
                    onPaymentDataChangeAction({
                      ...paymentData,
                      cvv: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="123"
                  maxLength={4}
                />
              </Field>
            </div>
          </>
        )}

        {/* Formulário de PIX (desativado temporariamente) */}
        {/*
        {selectedMethod === "pix" && (
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="cpf-pix">CPF *</FieldLabel>
              <Input
                id="cpf-pix"
                required
                value={paymentData.cpf || ""}
                onChange={(e) =>
                  onPaymentDataChangeAction({
                    ...paymentData,
                    cpf: formatCPF(e.target.value),
                  })
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <FieldDescription>
                Informe o CPF do titular para gerar o QR Code PIX
              </FieldDescription>
            </Field>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Como funciona:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Após confirmar o pedido, um QR Code será gerado</li>
                    <li>Abra o app do seu banco e escaneie o código</li>
                    <li>Confirme o pagamento</li>
                    <li>Pronto! Seu pedido será processado instantaneamente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        */}

        {/* Formulário de Boleto */}
        {selectedMethod === "boleto" && (
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="cpf-boleto">CPF *</FieldLabel>
              <Input
                id="cpf-boleto"
                required
                value={paymentData.cpf || ""}
                onChange={(e) =>
                  onPaymentDataChangeAction({
                    ...paymentData,
                    cpf: formatCPF(e.target.value),
                  })
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <FieldDescription>
                Informe o CPF do titular para emitir o boleto
              </FieldDescription>
            </Field>
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
          </div>
        )}
      </FieldSet>
    </FieldGroup>
  );
}
