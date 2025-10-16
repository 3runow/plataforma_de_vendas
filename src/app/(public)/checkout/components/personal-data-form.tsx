"use client";

import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

interface PersonalDataFormProps {
  formData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  onFormDataChangeAction: (data: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  }) => void;
}

export default function PersonalDataForm({
  formData,
  onFormDataChangeAction,
}: PersonalDataFormProps) {
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
              onChange={(e) =>
                onFormDataChangeAction({ ...formData, name: e.target.value })
              }
              placeholder="João Silva"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">E-mail *</FieldLabel>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                onFormDataChangeAction({ ...formData, email: e.target.value })
              }
              placeholder="joao@exemplo.com"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="cpf">CPF *</FieldLabel>
            <Input
              id="cpf"
              required
              value={formData.cpf}
              onChange={(e) =>
                onFormDataChangeAction({
                  ...formData,
                  cpf: formatCPF(e.target.value),
                })
              }
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Telefone *</FieldLabel>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={(e) =>
                onFormDataChangeAction({
                  ...formData,
                  phone: formatPhone(e.target.value),
                })
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </Field>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
