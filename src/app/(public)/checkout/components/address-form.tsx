"use client";

import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";

interface AddressFormProps {
  addressData: {
    addressName?: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    recipientName: string;
  };
  onAddressDataChangeAction: (data: {
    addressName?: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    recipientName: string;
  }) => void;
}

export default function AddressForm({
  addressData,
  onAddressDataChangeAction,
}: AddressFormProps) {
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  const handleCepBlur = async () => {
    const cep = addressData.cep.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const response = await fetch(`/api/cep/${cep}`);
        const data = await response.json();
        if (!data.error) {
          onAddressDataChangeAction({
            ...addressData,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>Informações de Endereço</FieldLegend>
        <FieldDescription>
          Digite o CEP para preenchimento automático
        </FieldDescription>

        {/* Campo de nome do endereço */}
        <Field>
          <FieldLabel htmlFor="addressName">Nome do Endereço</FieldLabel>
          <Input
            id="addressName"
            value={addressData.addressName || ""}
            onChange={(e) =>
              onAddressDataChangeAction({
                ...addressData,
                addressName: e.target.value,
              })
            }
            placeholder="Ex: Casa, Trabalho, Apartamento"
          />
          <FieldDescription>
            Como você quer chamar este endereço?
          </FieldDescription>
        </Field>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field>
            <FieldLabel htmlFor="cep">CEP *</FieldLabel>
            <Input
              id="cep"
              required
              value={addressData.cep}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  cep: formatCEP(e.target.value),
                })
              }
              onBlur={handleCepBlur}
              placeholder="00000-000"
              maxLength={9}
            />
            <FieldDescription>Informe seu CEP</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="recipientName">Destinatário *</FieldLabel>
            <Input
              id="recipientName"
              required
              value={addressData.recipientName}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  recipientName: e.target.value,
                })
              }
              placeholder="Nome do destinatário"
            />
            <FieldDescription>Quem irá receber o pedido</FieldDescription>
          </Field>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <Field>
              <FieldLabel htmlFor="street">Rua *</FieldLabel>
              <Input
                id="street"
                required
                value={addressData.street}
                onChange={(e) =>
                  onAddressDataChangeAction({
                    ...addressData,
                    street: e.target.value,
                  })
                }
                placeholder="Rua das Flores"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="number">Número *</FieldLabel>
            <Input
              id="number"
              required
              value={addressData.number}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  number: e.target.value,
                })
              }
              placeholder="123"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="complement">Complemento</FieldLabel>
            <Input
              id="complement"
              value={addressData.complement}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  complement: e.target.value,
                })
              }
              placeholder="Apto 101"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="neighborhood">Bairro *</FieldLabel>
            <Input
              id="neighborhood"
              required
              value={addressData.neighborhood}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  neighborhood: e.target.value,
                })
              }
              placeholder="Centro"
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field>
              <FieldLabel htmlFor="city">Cidade *</FieldLabel>
              <Input
                id="city"
                required
                value={addressData.city}
                onChange={(e) =>
                  onAddressDataChangeAction({
                    ...addressData,
                    city: e.target.value,
                  })
                }
                placeholder="São Paulo"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="state">Estado *</FieldLabel>
            <Input
              id="state"
              required
              value={addressData.state}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  state: e.target.value.toUpperCase(),
                })
              }
              placeholder="SP"
              maxLength={2}
            />
          </Field>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
