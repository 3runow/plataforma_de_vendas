import axios, { AxiosInstance } from "axios";

interface MelhorEnvioConfig {
  token: string;
  sandbox?: boolean;
}

interface Package {
  weight: number;
  width: number;
  height: number;
  length: number;
}

interface Product {
  name: string;
  quantity: number;
  unitary_value: number;
}

interface CalculateShippingParams {
  from: {
    postal_code: string;
  };
  to: {
    postal_code: string;
  };
  products?: Array<{
    id: string;
    width: number;
    height: number;
    length: number;
    weight: number;
    insurance_value: number;
    quantity: number;
  }>;
  package?: Package;
  options?: {
    insurance_value?: number;
    receipt?: boolean;
    own_hand?: boolean;
    collect?: boolean;
  };
  services?: string; // Ex: "1,2,3" (Correios PAC, SEDEX, etc)
}

interface ShippingQuote {
  id: number;
  name: string;
  price: string;
  custom_price: string;
  discount: string;
  currency: string;
  delivery_time: number;
  delivery_range: {
    min: number;
    max: number;
  };
  custom_delivery_time: number;
  custom_delivery_range: {
    min: number;
    max: number;
  };
  packages: Array<{
    price: string;
    discount: string;
    format: string;
    weight: string;
    insurance_value: string;
    products: Product[];
    dimensions: {
      height: number;
      width: number;
      length: number;
    };
  }>;
  company: {
    id: number;
    name: string;
    picture: string;
  };
  error?: string;
}

interface Package {
  weight: number;
  width: number;
  height: number;
  length: number;
}

interface Order {
  id: string;
  protocol: string;
  service_id: number;
  agency_id?: number;
  contract?: string;
  service_name: string;
  status: string;
  tracking?: string;
  created_at: string;
  paid_at?: string;
  generated_at?: string;
  posted_at?: string;
  delivered_at?: string;
  canceled_at?: string;
  expired_at?: string;
  price: number;
  discount: number;
  buyer_price: number;
}

interface TrackingEvent {
  id: number;
  status: string;
  description: string;
  location?: string;
  occurred_at: string;
}

interface TrackingInfo {
  id: string;
  protocol: string;
  status: string;
  tracking: string;
  melhorenvio_tracking?: string;
  created_at: string;
  paid_at?: string;
  generated_at?: string;
  posted_at?: string;
  delivered_at?: string;
  canceled_at?: string;
  expired_at?: string;
  tracking_events?: TrackingEvent[];
}

export class MelhorEnvioService {
  private client: AxiosInstance;
  private token: string;
  private baseURL: string;

  constructor(config: MelhorEnvioConfig) {
    this.token = config.token;
    this.baseURL = config.sandbox
      ? "https://sandbox.melhorenvio.com.br/api/v2"
      : "https://melhorenvio.com.br/api/v2";

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        "User-Agent": "Plataforma de Vendas (seu@email.com)",
      },
    });
  }

  /**
   * 1. AUTENTICAÇÃO
   * O token deve ser obtido através do OAuth2 do Melhor Envio
   * https://docs.melhorenvio.com.br/docs/autenticacao
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.client.get("/me");
      return response.status === 200;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      return false;
    }
  }

  /**
   * 2. COTAÇÃO DE FRETES
   * Calcula o valor e prazo de entrega para diferentes transportadoras
   */
  async calculateShipping(
    params: CalculateShippingParams
  ): Promise<ShippingQuote[]> {
    try {
      console.log(
        "📊 Calculando frete com params:",
        JSON.stringify(params, null, 2)
      );
      const response = await this.client.post("/me/shipment/calculate", params);
      console.log(`✅ ${response.data.length} cotações retornadas`);
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao calcular frete:",
        err.response?.data || err.message
      );
      throw new Error("Falha ao calcular frete");
    }
  }

  /**
   * 3. ADICIONAR AO CARRINHO
   * Adiciona uma cotação ao carrinho do Melhor Envio
   * IMPORTANTE: Deve enviar o objeto completo retornado pelo calculateShipping
   */
  async addToCart(
    items: unknown[]
  ): Promise<{ id: string } | { id: string }[]> {
    try {
      console.log("\n📦 ========================================");
      console.log("📦 TENTANDO ADICIONAR AO CARRINHO");
      console.log("📦 ========================================");
      console.log("📦 Número de items:", items.length);
      console.log("📦 Item completo:", JSON.stringify(items[0], null, 2));
      console.log("📦 ========================================\n");

      // 🔥 FIX CRÍTICO: A API espera o OBJETO direto, não um array!
      const payload = items[0]; // Pega o primeiro (e único) item do array
      console.log(
        "🔥 Enviando payload como OBJETO:",
        JSON.stringify(payload, null, 2)
      );

      const response = await this.client.post("/me/cart", payload);
      console.log("✅ Adicionado ao carrinho com sucesso:", response.data);
      return response.data;
    } catch (error) {
      const err = error as {
        response?: {
          data?: Record<string, unknown>;
          status?: number;
          headers?: unknown;
        };
      };
      const errorDetails = err.response?.data;
      console.error("\n❌ ========================================");
      console.error("❌ ERRO AO ADICIONAR AO CARRINHO");
      console.error("❌ ========================================");
      console.error("❌ Status:", err.response?.status);
      console.error(
        "❌ Headers:",
        JSON.stringify(err.response?.headers, null, 2)
      );
      console.error(
        "❌ RESPOSTA COMPLETA:",
        JSON.stringify(errorDetails, null, 2)
      );
      console.error("❌ Tipo da resposta:", typeof errorDetails);
      console.error("❌ Mensagem:", errorDetails?.message);
      console.error(
        "❌ Erros detalhados:",
        JSON.stringify(errorDetails?.errors, null, 2)
      );
      console.error("❌ ========================================\n");

      // Extrair mensagem de erro mais específica
      let errorMessage = "Falha ao adicionar ao carrinho do Melhor Envio";
      if (errorDetails?.message) {
        errorMessage = String(errorDetails.message);
      } else if (errorDetails?.errors) {
        errorMessage = JSON.stringify(errorDetails.errors);
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * 4. COMPRA DE FRETES
   * Finaliza a compra dos fretes no carrinho
   */
  async checkout(
    orderIds: string[]
  ): Promise<{ purchase: { id: string; protocol: string; total: number } }> {
    try {
      const response = await this.client.post("/me/shipment/checkout", {
        orders: orderIds,
      });
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao finalizar compra:",
        err.response?.data || err.message
      );
      throw new Error("Falha ao finalizar compra de frete");
    }
  }

  /**
   * 5. GERAÇÃO DE ETIQUETAS
   * Gera as etiquetas de envio
   */
  async generateLabels(
    orderIds: string[]
  ): Promise<{ id: string; status: string }[]> {
    try {
      const response = await this.client.post("/me/shipment/generate", {
        orders: orderIds,
      });
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao gerar etiquetas:",
        err.response?.data || err.message
      );
      throw new Error("Falha ao gerar etiquetas");
    }
  }

  /**
   * 6. IMPRESSÃO DE ETIQUETAS
   * Obtém o PDF das etiquetas para impressão
   */
  async printLabels(
    orderIds: string[],
    mode: "private" | "public" = "private"
  ): Promise<string> {
    try {
      const response = await this.client.post("/me/shipment/print", {
        mode,
        orders: orderIds,
      });
      return response.data.url; // URL do PDF
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao imprimir etiquetas:",
        err.response?.data || err.message
      );
      throw new Error("Falha ao gerar PDF das etiquetas");
    }
  }

  /**
   * 7. RASTREIO DE FRETES
   * Rastreia um ou mais envios
   */
  async trackShipment(trackingCode: string): Promise<TrackingInfo> {
    try {
      const response = await this.client.get(`/me/shipment/tracking`, {
        params: { orders: trackingCode },
      });

      // A API retorna um objeto com o código de rastreio como chave
      const trackingData = response.data[trackingCode];
      
      if (!trackingData) {
        throw new Error(`Código de rastreio "${trackingCode}" não encontrado`);
      }
      
      return trackingData;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao rastrear envio:",
        err.response?.data || err.message
      );
      throw new Error(err.message || "Falha ao rastrear envio");
    }
  }

  /**
   * 8. OBTER DETALHES DE UM PEDIDO
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await this.client.get(`/me/orders/${orderId}`);
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error("Erro ao obter pedido:", err.response?.data || err.message);
      throw new Error("Falha ao obter detalhes do pedido");
    }
  }

  /**
   * 9. CANCELAR ENVIO
   */
  async cancelShipment(
    orderId: string,
    reason?: string
  ): Promise<{ canceled: boolean }> {
    try {
      const response = await this.client.post(`/me/shipment/cancel`, {
        order: { id: orderId },
        reason,
      });
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao cancelar envio:",
        err.response?.data || err.message
      );
      throw new Error("Falha ao cancelar envio");
    }
  }

  /**
   * 10. VERIFICAR SALDO
   */
  async getBalance(): Promise<number> {
    try {
      const response = await this.client.get("/me/balance");
      return response.data.balance;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error("Erro ao obter saldo:", err.response?.data || err.message);
      throw new Error("Falha ao obter saldo");
    }
  }

  /**
   * 11. LISTAR AGÊNCIAS
   */
  async getAgencies(params: {
    city?: string;
    state?: string;
    country?: string;
  }): Promise<{ id: number; name: string; address: string }[]> {
    try {
      const response = await this.client.get("/me/shipment/agencies", {
        params,
      });
      return response.data;
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao listar agências:",
        err.response?.data || err.message
      );
      throw new Error("Falha ao listar agências");
    }
  }

  /**
   * HELPER: Fluxo completo de compra de frete
   * Recebe os dados completos e executa: cotação → adicionar ao carrinho → checkout → etiqueta
   */
  async purchaseShipping(shippingData: {
    serviceId: number;
    from: {
      postal_code: string;
      name?: string;
      phone?: string;
      email?: string;
      document?: string;
      address?: string;
      number?: string;
      district?: string;
      city?: string;
      state_abbr?: string;
    };
    to: {
      postal_code: string;
      name?: string;
      phone?: string;
      email?: string;
      document?: string;
      address?: string;
      number?: string;
      district?: string;
      city?: string;
      state_abbr?: string;
    };
    products: Array<{
      id: string;
      width: number;
      height: number;
      length: number;
      weight: number;
      insurance_value: number;
      quantity: number;
    }>;
    options?: {
      receipt?: boolean;
      own_hand?: boolean;
      insurance_value?: number;
    };
  }): Promise<{
    orderId: string;
    protocol: string;
    trackingCode: string;
    labelUrl: string;
  }> {
    try {
      console.log("\n🚀 ============================================");
      console.log("🚀 CÓDIGO NOVO - VERSÃO COM VOLUMES");
      console.log("🚀 ============================================");
      console.log("🚀 Iniciando fluxo de compra de frete...");
      console.log("📋 Dados da compra:", {
        serviceId: shippingData.serviceId,
        from: shippingData.from.postal_code,
        to: shippingData.to.postal_code,
        products: shippingData.products,
      });

      // 1. Fazer cotação primeiro (só precisa CEPs e produtos)
      console.log("1️⃣ Fazendo cotação...");
      const quotes = await this.calculateShipping({
        from: { postal_code: shippingData.from.postal_code },
        to: { postal_code: shippingData.to.postal_code },
        products: shippingData.products,
        options: shippingData.options,
      });

      console.log(`📦 ${quotes.length} cotações retornadas`);

      // Listar todas as cotações disponíveis
      quotes.forEach((q, index: number) => {
        const status = q.error ? `❌ ${q.error}` : `✅ R$ ${q.price}`;
        console.log(`   ${index + 1}. [ID: ${q.id}] ${q.name} - ${status}`);
      });

      // Encontrar a cotação do serviço selecionado
      let selectedQuote = quotes.find((q) => q.id === shippingData.serviceId);

      // Se o serviço selecionado não foi encontrado ou tem erro, pegar o primeiro disponível
      if (!selectedQuote) {
        console.log(
          `⚠️  Serviço ${shippingData.serviceId} não encontrado, buscando alternativa...`
        );
        selectedQuote = quotes.find((q) => !q.error);

        if (!selectedQuote) {
          // Listar todos os erros
          const errors = quotes
            .map((q) => `${q.name}: ${q.error || "Sem erro"}`)
            .join("; ");
          throw new Error(
            `Nenhum serviço de entrega disponível para este trecho. Erros: ${errors}`
          );
        }

        console.log(
          `✅ Usando serviço alternativo: ${selectedQuote.name} (ID: ${selectedQuote.id})`
        );
      } else if (selectedQuote.error) {
        console.log(
          `⚠️  Serviço selecionado tem erro: ${selectedQuote.error}, buscando alternativa...`
        );
        const alternative = quotes.find((q) => !q.error);

        if (!alternative) {
          throw new Error(
            `Transportadora não atende este trecho. Erro: ${selectedQuote.error}`
          );
        }

        selectedQuote = alternative;
        console.log(
          `✅ Usando serviço alternativo: ${selectedQuote.name} (ID: ${selectedQuote.id})`
        );
      }

      console.log(
        `✅ Cotação selecionada: ${selectedQuote.name} - R$ ${selectedQuote.price} (${selectedQuote.delivery_time} dias)`
      );

      // 2. Preparar dados para o carrinho (precisa dados completos de endereço e documentos válidos)
      console.log("2️⃣ Preparando dados para o carrinho...");

      interface CartPayload {
        service: number;
        agency: null;
        from: {
          name: string;
          phone: string;
          email: string;
          document: string;
          address: string;
          complement?: string;
          number: string;
          district: string;
          city: string;
          state_abbr: string;
          country_id: string;
          postal_code: string;
        };
        to: {
          name: string;
          phone: string;
          email: string;
          document: string;
          address: string;
          complement?: string;
          number: string;
          district: string;
          city: string;
          state_abbr: string;
          country_id: string;
          postal_code: string;
        };
        products: Array<{
          name: string;
          quantity: number;
          unitary_value: number;
        }>;
        volumes: Array<{
          height: number;
          width: number;
          length: number;
          weight: number;
        }>;
        options: {
          insurance_value?: number;
          receipt?: boolean;
          own_hand?: boolean;
          reverse?: boolean;
          non_commercial?: boolean;
          invoice?: {
            key: string;
          };
        };
      }

      const cartPayload: CartPayload = {
        service: selectedQuote.id,
        agency: null,
        from: {
          name: shippingData.from.name || "Loja",
          phone: shippingData.from.phone || "1140004000",
          email: shippingData.from.email || "contato@loja.com",
          document: shippingData.from.document || "16571478000172", // CNPJ válido de exemplo
          address: shippingData.from.address || "Endereço",
          complement: "",
          number: shippingData.from.number || "100",
          district: shippingData.from.district || "Centro",
          city: shippingData.from.city || "São Paulo",
          state_abbr: shippingData.from.state_abbr || "SP",
          country_id: "BR",
          postal_code: shippingData.from.postal_code,
        },
        to: {
          name: shippingData.to.name || "Cliente",
          phone: shippingData.to.phone || "1140004000",
          email: shippingData.to.email || "cliente@email.com",
          document: shippingData.to.document || "12345678909", // CPF válido de exemplo
          address: shippingData.to.address || "Endereço",
          complement: "",
          number: shippingData.to.number || "100",
          district: shippingData.to.district || "Centro",
          city: shippingData.to.city || "São Paulo",
          state_abbr: shippingData.to.state_abbr || "SP",
          country_id: "BR",
          postal_code: shippingData.to.postal_code,
        },
        products: shippingData.products.map((p) => ({
          name: `Produto ${p.id}`,
          quantity: p.quantity,
          unitary_value: p.insurance_value,
        })),
        // 🔥 FIX: Consolidar TODOS os produtos em UM ÚNICO volume
        // Muitas transportadoras (como SEDEX) não aceitam múltiplos volumes
        volumes: [
          {
            height: Math.max(...shippingData.products.map((p) => p.height)),
            width: Math.max(...shippingData.products.map((p) => p.width)),
            length: Math.max(...shippingData.products.map((p) => p.length)),
            weight: shippingData.products.reduce(
              (sum, p) => sum + p.weight * p.quantity,
              0
            ),
          },
        ],
        options: {
          insurance_value: shippingData.options?.insurance_value || 0,
          receipt: shippingData.options?.receipt || false,
          own_hand: shippingData.options?.own_hand || false,
          non_commercial: false,
        },
      };

      console.log(
        "📋 Payload do carrinho:",
        JSON.stringify(cartPayload, null, 2)
      );

      // 3. Adicionar ao carrinho
      console.log("3️⃣ Adicionando ao carrinho...");
      const cartResponse = await this.addToCart([cartPayload]);

      // 🔥 FIX: A API retorna objeto único, não array
      const orderId =
        typeof cartResponse === "object" &&
        cartResponse !== null &&
        "id" in cartResponse
          ? cartResponse.id
          : Array.isArray(cartResponse) && cartResponse[0]?.id
            ? cartResponse[0].id
            : null;

      if (!orderId) {
        console.error("❌ Resposta do carrinho:", cartResponse);
        throw new Error("Falha ao adicionar ao carrinho - ID não retornado");
      }

      console.log(`✅ Adicionado ao carrinho: ${orderId}`);

      // 3. Fazer checkout
      console.log("3️⃣ Fazendo checkout...");
      const checkoutResponse = await this.checkout([orderId]);
      console.log(
        `✅ Checkout concluído: ${checkoutResponse.purchase.protocol}`
      );

      // 4. Gerar etiqueta
      console.log("4️⃣ Gerando etiqueta...");
      await this.generateLabels([orderId]);
      console.log("✅ Etiqueta gerada");

      // 5. Obter URL de impressão
      console.log("5️⃣ Obtendo URL de impressão...");
      const labelUrl = await this.printLabels([orderId]);
      console.log(`✅ URL da etiqueta: ${labelUrl}`);

      // 6. Obter detalhes do pedido
      console.log("6️⃣ Obtendo detalhes do pedido...");
      const order = await this.getOrder(orderId);

      return {
        orderId,
        protocol: order.protocol,
        trackingCode: order.tracking || "",
        labelUrl,
      };
    } catch (error) {
      console.error("❌ Erro no fluxo de compra:", error);
      throw error;
    }
  }
}

// Singleton instance
let melhorEnvioInstance: MelhorEnvioService | null = null;

export function getMelhorEnvioService(): MelhorEnvioService {
  if (!melhorEnvioInstance) {
    const token = process.env.MELHOR_ENVIO_TOKEN;
    const sandbox = process.env.MELHOR_ENVIO_SANDBOX === "true";

    if (!token) {
      throw new Error("MELHOR_ENVIO_TOKEN não configurado");
    }

    melhorEnvioInstance = new MelhorEnvioService({ token, sandbox });
  }

  return melhorEnvioInstance;
}
