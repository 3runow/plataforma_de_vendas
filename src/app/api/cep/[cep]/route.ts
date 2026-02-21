import { NextRequest, NextResponse } from "next/server";

type CepProvider = {
  name: string;
  buildUrl: (cep: string) => string;
  normalize: (payload: Record<string, unknown>) => Record<string, unknown>;
  invalidResponse?: (payload: Record<string, unknown>) => boolean;
};

const CEP_PROVIDERS: CepProvider[] = [
  {
    name: "ViaCEP",
    buildUrl: (cep) => `https://viacep.com.br/ws/${cep}/json/`,
    normalize: (payload) => payload,
    invalidResponse: (payload) => Boolean(payload.erro),
  },
  {
    name: "BrasilAPI",
    buildUrl: (cep) => `https://brasilapi.com.br/api/cep/v1/${cep}`,
    normalize: (payload) => ({
      cep: payload.cep,
      logradouro: payload.street,
      bairro: payload.neighborhood,
      localidade: payload.city,
      uf: payload.state,
    }),
  },
];

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cep: string }> }
) {
  try {
    const { cep: cepParam } = await context.params;
    const cep = cepParam.replace(/\D/g, "");

    if (cep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
    }

    let notFound = false;

    for (const provider of CEP_PROVIDERS) {
      try {
        const response = await fetch(provider.buildUrl(cep), {
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "User-Agent": "PlataformaVendas/1.0 (+https://example.com)",
          },
        });

        if (response.status === 404) {
          notFound = true;
          throw new Error(`${provider.name} retornou 404 (CEP não encontrado)`);
        }

        if (!response.ok) {
          throw new Error(
            `${provider.name} retornou status ${response.status}`
          );
        }

        const rawData = (await response.json()) as Record<string, unknown>;

        if (provider.invalidResponse?.(rawData)) {
          notFound = true;
          throw new Error(`${provider.name} respondeu erro de CEP`);
        }

        const normalized = provider.normalize(rawData);

        if (!normalized || Object.keys(normalized).length === 0) {
          throw new Error(`${provider.name} retornou payload vazio`);
        }

        return NextResponse.json(normalized);
      } catch (providerError) {
        console.warn(
          `[CEP] Falha no provedor ${provider.name}:`,
          providerError instanceof Error ? providerError.message : providerError
        );
        continue;
      }
    }

    if (notFound) {
      return NextResponse.json({ error: "CEP NÃO ENCONTRADO" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Não foi possível consultar o CEP. Tente novamente." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return NextResponse.json({ error: "Erro ao buscar CEP" }, { status: 500 });
  }
}
