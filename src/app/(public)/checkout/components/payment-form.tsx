"use client";

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

interface PaymentFormProps {
  paymentData: {
    cardNumber: string;
    cardName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  onPaymentDataChange: (data: {
    cardNumber: string;
    cardName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) => void;
}

export default function PaymentForm({
  paymentData,
  onPaymentDataChange,
}: PaymentFormProps) {
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

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Método de Pagamento</FieldLegend>
        <FieldDescription>
          Todas as transações são seguras e criptografadas
        </FieldDescription>
        <Field>
          <FieldLabel htmlFor="cardName">Nome no Cartão *</FieldLabel>
          <Input
            id="cardName"
            required
            value={paymentData.cardName}
            onChange={(e) =>
              onPaymentDataChange({
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
              onPaymentDataChange({
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
                onPaymentDataChange({ ...paymentData, expiryMonth: value })
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
                onPaymentDataChange({ ...paymentData, expiryYear: value })
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
                onPaymentDataChange({
                  ...paymentData,
                  cvv: e.target.value.replace(/\D/g, ""),
                })
              }
              placeholder="123"
              maxLength={4}
            />
          </Field>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
