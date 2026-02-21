"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldError,
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
  forceShowErrors?: boolean;
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
  forceShowErrors = false,
  onAddressDataChangeAction,
}: AddressFormProps) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const lastRequestedCepRef = useRef<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // ref to always have the latest addressData inside the effect without adding it to deps
  const addressDataRef = useRef(addressData);
  useEffect(() => {
    addressDataRef.current = addressData;
  });

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  };

  // validate CEP format before hitting the API: 8 digits, non-zero prefix
  const isCepFormatValid = (digits: string) =>
    digits.length === 8 && !/^0{8}$/.test(digits) && /^\d{8}$/.test(digits);

  useEffect(() => {
    const sanitizedCep = addressData.cep.replace(/\D/g, "");

    // reset when user hasn't typed 8 digits yet
    if (sanitizedCep.length !== 8) {
      setCepError(null);
      setIsLoadingCep(false);
      lastRequestedCepRef.current = "";
      return;
    }

    // quick format check — flag invalid immediately without hitting the API
    if (!isCepFormatValid(sanitizedCep)) {
      setCepError("CEP NÃO ENCONTRADO");
      setIsLoadingCep(false);
      lastRequestedCepRef.current = sanitizedCep;
      return;
    }

    // same CEP already fetched (success or error) — do not re-fetch
    if (sanitizedCep === lastRequestedCepRef.current) {
      return;
    }

    const controller = new AbortController();
    lastRequestedCepRef.current = sanitizedCep;
    setIsLoadingCep(true);
    setCepError(null);

    const fetchAddress = async () => {
      try {
        const response = await fetch(`/api/cep/${sanitizedCep}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok || data.error) {
          const rawMessage =
            (typeof data?.error === "string" && data.error) ||
            (response.status === 404 ? "CEP NÃO ENCONTRADO" : null) ||
            "Erro ao buscar CEP";

          const normalizedMessage = /cep\s*n[aã]o\s*encontrado/i.test(rawMessage)
            ? "CEP NÃO ENCONTRADO"
            : rawMessage;

          throw new Error(normalizedMessage);
        }

        onAddressDataChangeAction({
          ...addressDataRef.current,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Erro ao buscar CEP";

        setCepError(
          /cep\s*n[aã]o\s*encontrado/i.test(message)
            ? "CEP NÃO ENCONTRADO"
            : message
        );

        // clear auto-filled fields but do NOT reset lastRequestedCepRef
        // (resetting it would cause an infinite loop re-fetching the same bad CEP)
        onAddressDataChangeAction({
          ...addressDataRef.current,
          street: "",
          neighborhood: "",
          city: "",
          state: "",
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCep(false);
        }
      }
    };

    void fetchAddress();

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressData.cep, onAddressDataChangeAction]);

  const digitsOnlyCep = addressData.cep.replace(/\D/g, "");
  const validation = {
    cep: digitsOnlyCep.length === 8,
    recipientName: addressData.recipientName.trim().length > 0,
    street: addressData.street.trim().length > 0,
    number: addressData.number.trim().length > 0,
    neighborhood: addressData.neighborhood.trim().length > 0,
    city: addressData.city.trim().length > 0,
    state: addressData.state.trim().length === 2,
  };

  const showFieldError = (field: keyof typeof validation) =>
    forceShowErrors || Boolean(touched[field]);

  // classe CSS de borda vermelha aplicada diretamente para garantir visibilidade
  const errCls = (field: keyof typeof validation) =>
    showFieldError(field) && !validation[field]
      ? "border-red-500 border-2 focus-visible:border-red-500 focus-visible:ring-red-300/50"
      : "";

  const requiredMessage = "Campo obrigatório";

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
              aria-invalid={Boolean(cepError) || (showFieldError("cep") && !validation.cep)}
              className={cepError ? "border-red-500 border-2 focus-visible:border-red-500 focus-visible:ring-red-300/50" : errCls("cep")}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  cep: formatCEP(e.target.value),
                })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, cep: true }))}
              placeholder="00000-000"
              maxLength={9}
            />
            <FieldDescription>
              {isLoadingCep
                ? "Buscando endereço pelo CEP..."
                : "Informe seu CEP"}
            </FieldDescription>
            {cepError ? (
              <FieldError className="text-base font-semibold">{cepError}</FieldError>
            ) : (
              showFieldError("cep") &&
              !validation.cep && (
                <FieldError className="text-base font-semibold">
                  Informe um CEP válido (8 dígitos)
                </FieldError>
              )
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="recipientName">Destinatário *</FieldLabel>
            <Input
              id="recipientName"
              required
              value={addressData.recipientName}
              aria-invalid={showFieldError("recipientName") && !validation.recipientName}
              className={errCls("recipientName")}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  recipientName: e.target.value,
                })
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, recipientName: true }))
              }
              placeholder="Nome do destinatário"
            />
            <FieldDescription>Quem irá receber o pedido</FieldDescription>
            {showFieldError("recipientName") && !validation.recipientName && (
              <FieldError className="text-base font-semibold">
                {requiredMessage}
              </FieldError>
            )}
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
                aria-invalid={showFieldError("street") && !validation.street}
                className={errCls("street")}
                onChange={(e) =>
                  onAddressDataChangeAction({
                    ...addressData,
                    street: e.target.value,
                  })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, street: true }))}
                placeholder="Rua das Flores"
              />
              {showFieldError("street") && !validation.street && (
                <FieldError className="text-base font-semibold">
                  {requiredMessage}
                </FieldError>
              )}
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="number">Número *</FieldLabel>
            <Input
              id="number"
              required
              value={addressData.number}
              aria-invalid={showFieldError("number") && !validation.number}
              className={errCls("number")}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  number: e.target.value,
                })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, number: true }))}
              placeholder="123"
            />
            {showFieldError("number") && !validation.number && (
              <FieldError className="text-base font-semibold">
                {requiredMessage}
              </FieldError>
            )}
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
              aria-invalid={showFieldError("neighborhood") && !validation.neighborhood}
              className={errCls("neighborhood")}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  neighborhood: e.target.value,
                })
              }
              onBlur={() =>
                setTouched((prev) => ({ ...prev, neighborhood: true }))
              }
              placeholder="Centro"
            />
            {showFieldError("neighborhood") && !validation.neighborhood && (
              <FieldError className="text-base font-semibold">
                {requiredMessage}
              </FieldError>
            )}
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
                aria-invalid={showFieldError("city") && !validation.city}                className={errCls("city")}                onChange={(e) =>
                  onAddressDataChangeAction({
                    ...addressData,
                    city: e.target.value,
                  })
                }
                onBlur={() => setTouched((prev) => ({ ...prev, city: true }))}
                placeholder="São Paulo"
              />
              {showFieldError("city") && !validation.city && (
                <FieldError className="text-base font-semibold">
                  {requiredMessage}
                </FieldError>
              )}
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="state">Estado *</FieldLabel>
            <Input
              id="state"
              required
              value={addressData.state}
              aria-invalid={showFieldError("state") && !validation.state}
              className={errCls("state")}
              onChange={(e) =>
                onAddressDataChangeAction({
                  ...addressData,
                  state: e.target.value.toUpperCase(),
                })
              }
              onBlur={() => setTouched((prev) => ({ ...prev, state: true }))}
              placeholder="SP"
              maxLength={2}
            />
            {showFieldError("state") && !validation.state && (
              <FieldError className="text-base font-semibold">
                Informe a UF (2 letras)
              </FieldError>
            )}
          </Field>
        </div>
      </FieldSet>
    </FieldGroup>
  );
}
