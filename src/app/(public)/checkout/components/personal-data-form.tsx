"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

interface PersonalDataFormProps {
  formData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  forceShowErrors?: boolean;
  onFormDataChangeAction: (data: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  }) => void;
}

export default function PersonalDataForm({
  formData,
  forceShowErrors = false,
  onFormDataChangeAction,
}: PersonalDataFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const digits = (value: string) => value.replace(/\D/g, "");

  const validateCPF = (cpf: string): boolean => {
    const d = cpf.replace(/\D/g, "");
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += +d[i] * (10 - i);
    let r = (s * 10) % 11;
    if (r >= 10) r = 0;
    if (r !== +d[9]) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += +d[i] * (11 - i);
    r = (s * 10) % 11;
    if (r >= 10) r = 0;
    return r === +d[10];
  };

  const validation = {
    name: formData.name.trim().length >= 2,
    email: formData.email.includes("@"),
    cpf:
      digits(formData.cpf).length === 11 && validateCPF(formData.cpf),
    phone: digits(formData.phone).length >= 10,
  };

  const showFieldError = (field: keyof typeof validation) =>
    forceShowErrors || Boolean(touched[field]);

  return (
    <FieldGroup>
      <FieldSet>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="name">Nome Completo *</FieldLabel>
            <Input
              id="name"
              required
              value={formData.name}
              aria-invalid={showFieldError("name") && !validation.name}
              onChange={(e) =>
                onFormDataChangeAction({ ...formData, name: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              placeholder="João Silva"
            />
            {showFieldError("name") && !validation.name && (
              <FieldError className="text-base font-semibold">
                Informe seu nome completo
              </FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail *</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              aria-invalid={showFieldError("email") && !validation.email}
              onChange={(e) =>
                onFormDataChangeAction({ ...formData, email: e.target.value })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              placeholder="joao@exemplo.com"
            />
            {showFieldError("email") && !validation.email && (
              <FieldError className="text-base font-semibold">
                Informe um e-mail válido
              </FieldError>
            )}
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="cpf">CPF *</FieldLabel>
            <Input
              id="cpf"
              required
              value={formData.cpf}
              aria-invalid={showFieldError("cpf") && !validation.cpf}
              onChange={(e) =>
                onFormDataChangeAction({
                  ...formData,
                  cpf: formatCPF(e.target.value),
                })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, cpf: true }))}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            {showFieldError("cpf") && !validation.cpf && (
              <FieldError className="text-base font-semibold">
                {digits(formData.cpf).length === 11
                  ? "CPF inválido. Verifique os dígitos."
                  : "Informe um CPF válido (11 dígitos)"}
              </FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Telefone *</FieldLabel>
            <Input
              id="phone"
              required
              value={formData.phone}
              aria-invalid={showFieldError("phone") && !validation.phone}
              onChange={(e) =>
                onFormDataChangeAction({
                  ...formData,
                  phone: formatPhone(e.target.value),
                })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
            {showFieldError("phone") && !validation.phone && (
              <FieldError className="text-base font-semibold">
                Informe um telefone válido
              </FieldError>
            )}
          </Field>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
