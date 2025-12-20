import { Elysia } from "elysia";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { prisma } from "../src/lib/prisma";
import { getMelhorEnvioService } from "../src/lib/melhor-envio";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET não configurado nas variáveis de ambiente. Configure a variável JWT_SECRET no arquivo .env"
  );
}

const app = new Elysia()
  // retorna JSON consistente para erros não tratados
  .onError(({ error, set }) => {
    set.status = 500;
    const message =
      error instanceof Error
        ? error.message
        : String(error ?? "Erro interno do servidor");
    return { error: message };
  })
  // registro
  .post("/api/register", async ({ body, set }) => {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().max(255),
      password: z
        .string()
        .min(8)
        .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
        .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
        .regex(/\d/, "Senha deve conter pelo menos um número"),
      cpf: z
        .string()
        .min(11, "CPF deve ter 11 dígitos")
        .max(14, "CPF inválido")
        .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido"),
      phone: z
        .string()
        .min(10, "Telefone deve ter no mínimo 10 dígitos")
        .max(15, "Telefone inválido"),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
    }

    const { name, email, password, cpf, phone } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const cleanCpf = cpf.replace(/\D/g, "");

      const existing = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });
      if (existing) {
        if (!existing.isGuest) {
          set.status = 409;
          return { error: "E-Mail já cadastrado." };
        }

        const hashed = await bcrypt.hash(password, 10);
        const updatedUser = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            email: normalizedEmail,
            password: hashed,
            cpf: cleanCpf,
            phone,
            isGuest: false,
          },
        });

        // Contar pedidos que o guest já tinha
        const ordersCount = await prisma.order.count({
          where: { userId: updatedUser.id },
        });

        console.log(`✅ Guest ${normalizedEmail} convertido para usuário real. ${ordersCount} pedido(s) já vinculado(s).`);

        return { 
          id: updatedUser.id, 
          name: updatedUser.name, 
          email: updatedUser.email,
          linkedOrders: ordersCount,
          message: ordersCount > 0 ? `${ordersCount} pedido(s) vinculado(s) à sua conta!` : undefined,
        };
      }

      // Verificar se CPF já existe
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: cleanCpf },
      });
      if (existingCpf) {
        set.status = 409;
        return { error: "CPF já cadastrado." };
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashed,
          cpf: cleanCpf,
          phone,
        },
      });

      return { id: user.id, name: user.name, email: user.email };
    } catch (e: unknown) {
      set.status = 500;
      console.error("Erro ao criar usuário:", e);
      return { error: "Erro ao criar usuário" };
    }
  })

  // login
  .post("/api/login", async ({ body, set }) => {
    const schema = z.object({
      email: z.string().email().max(255),
      password: z.string().min(1),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });
      if (!user) {
        set.status = 404;
        return { error: "Usuário não encontrado." };
      }

      if (user.email !== normalizedEmail) {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail },
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        set.status = 401;
        return { error: "Senha incorreta." };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

  set.headers["Set-Cookie"] = cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      // Vincular pedidos de guests com mesmo email ao usuário logado
      let linkedOrdersCount = 0;
      try {
        // Buscar guests com mesmo email (que não seja o próprio usuário)
        const guestUsers = await prisma.user.findMany({
          where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            isGuest: true,
            id: { not: user.id },
          },
          select: { id: true },
        });

        if (guestUsers.length > 0) {
          const guestIds = guestUsers.map((g) => g.id);
          
          // Vincular pedidos ao usuário logado
          const result = await prisma.order.updateMany({
            where: { userId: { in: guestIds } },
            data: { userId: user.id },
          });
          linkedOrdersCount = result.count;

          // Vincular endereços
          await prisma.address.updateMany({
            where: { userId: { in: guestIds } },
            data: { userId: user.id },
          });

          // Vincular itens do carrinho
          await prisma.cartItem.updateMany({
            where: { userId: { in: guestIds } },
            data: { userId: user.id },
          });

          console.log(`✅ Login: ${linkedOrdersCount} pedido(s) de guest vinculado(s) ao usuário ${normalizedEmail}`);
        }
      } catch (linkError) {
        console.error("Erro ao vincular pedidos de guest:", linkError);
        // Não falha o login por causa disso
      }

      return {
        message: "Login bem-sucedido.",
        user: { id: user.id, email: user.email },
        linkedOrders: linkedOrdersCount > 0 ? linkedOrdersCount : undefined,
      };
    } catch (e: unknown) {
      set.status = 500;
      console.error("Erro ao realizar login:", e);
      return { error: "Erro ao realizar login" };
    }
  })

  // logout
  .post("/api/logout", async ({ set }) => {
    set.headers["Set-Cookie"] = cookie.serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0, // Expira imediatamente
    });

    return { message: "Logout realizado com sucesso." };
  })

  // rota protegida
  .get("/api/me", async ({ request }: { request: Request }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) return { error: "Não autenticado." };

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        email: string;
        name: string;
        role?: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return { user };
    } catch {
      return { error: "Token inválido." };
    }
  })

  // ===== PRODUTOS =====
  // Listar todos os produtos (público)
  .get("/api/products", async ({ set }) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
      return products;
    } catch (e: unknown) {
      console.error("Erro ao buscar produtos:", e);
      set.status = 500;
      return { error: "Erro ao buscar produtos" };
    }
  })

  // Criar produto
  .post("/api/products", async ({ body, request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      console.log("Usuário tentando criar produto:", {
        id: user?.id,
        email: user?.email,
        role: user?.role,
      });

      if (!user || user.role !== "admin") {
        console.log("Acesso negado - usuário:", user);
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      const schema = z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        imageUrl: z.string().optional(),
        imageUrls: z.array(z.string().url()).optional(),
        discount: z.number().min(0).max(100).optional(),
        isNew: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      });

      console.log("Dados recebidos no body:", body);

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        console.error("Erro de validação:", parsed.error.issues);
        set.status = 400;
        return {
          error: parsed.error.issues[0]?.message || "Dados inválidos",
          details: parsed.error.issues,
        };
      }

      console.log("Criando produto com dados:", parsed.data);

      const product = await prisma.product.create({
        data: parsed.data,
      });

      console.log("Produto criado com sucesso:", product);

      return product;
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error("Erro detalhado ao criar produto:", error);
      console.error("Stack trace:", error.stack);
      set.status = 500;
      // Não expor detalhes do erro em produção
      const isDevelopment = process.env.NODE_ENV === "development";
      return {
        error: "Erro ao criar produto",
        ...(isDevelopment && {
          message: error.message,
          details: error.toString(),
        }),
      };
    }
  })

  // Atualizar produto
  .put("/api/products/:id", async ({ params, body, request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      const schema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0).optional(),
        imageUrl: z.string().optional(),
        imageUrls: z.array(z.string().url()).optional(),
        discount: z.number().min(0).max(100).optional(),
        isNew: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return {
          error: parsed.error.issues[0]?.message || "Dados inválidos",
        };
      }

      console.log("Atualizando produto com dados:", parsed.data);

      const productId = parseInt(params.id);
      if (isNaN(productId)) {
        set.status = 400;
        return { error: "ID do produto inválido" };
      }

      const product = await prisma.product.update({
        where: { id: productId },
        data: parsed.data,
      });

      return product;
    } catch (e: unknown) {
      console.error("Erro ao atualizar produto:", e);
      set.status = 500;
      return { error: "Erro ao atualizar produto" };
    }
  })

  // Deletar produto
  .delete("/api/products/:id", async ({ params, request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      const productId = parseInt(params.id);
      if (isNaN(productId)) {
        set.status = 400;
        return { error: "ID do produto inválido" };
      }

      await prisma.product.delete({
        where: { id: productId },
      });

      return { message: "Produto deletado com sucesso" };
    } catch (e: unknown) {
      console.error("Erro ao deletar produto:", e);
      set.status = 500;
      return { error: "Erro ao deletar produto" };
    }
  })

  // ===== PEDIDOS =====
  // Atualizar status de pedido
  .put("/api/orders/:id", async ({ params, body, request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      const schema = z.object({
        status: z.enum([
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ]),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return {
          error: parsed.error.issues[0]?.message || "Dados inválidos",
        };
      }

      const orderId = parseInt(params.id);
      if (isNaN(orderId)) {
        set.status = 400;
        return { error: "ID do pedido inválido" };
      }

      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: parsed.data.status },
      });

      return order;
    } catch (e: unknown) {
      console.error("Erro ao atualizar pedido:", e);
      set.status = 500;
      return { error: "Erro ao atualizar pedido" };
    }
  })

  // ===== USUÁRIOS =====
  // Atualizar role de usuário
  .put("/api/users/:id", async ({ params, body, request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      const schema = z.object({
        role: z.enum(["customer", "admin"]).optional(),
      });

      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        set.status = 400;
        return {
          error: parsed.error.issues[0]?.message || "Dados inválidos",
        };
      }

      const userId = parseInt(params.id);
      if (isNaN(userId)) {
        set.status = 400;
        return { error: "ID do usuário inválido" };
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: parsed.data,
      });

      return updatedUser;
    } catch (e: unknown) {
      console.error("Erro ao atualizar usuário:", e);
      set.status = 500;
      return { error: "Erro ao atualizar usuário" };
    }
  })

  // Deletar usuário
  .delete("/api/users/:id", async ({ params, request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      const userId = parseInt(params.id);
      if (isNaN(userId)) {
        set.status = 400;
        return { error: "ID do usuário inválido" };
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      return { message: "Usuário deletado com sucesso" };
    } catch (e: unknown) {
      console.error("Erro ao deletar usuário:", e);
      set.status = 500;
      return { error: "Erro ao deletar usuário" };
    }
  })

  // ===== WEBHOOKS MELHOR ENVIO =====
  // Webhook para rastreamento de entregas
  .post("/api/webhooks/melhor-envio/tracking", async ({ body, set }) => {
    const timestamp = new Date().toISOString();
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📦 [${timestamp}] WEBHOOK MELHOR ENVIO RECEBIDO`);
    console.log(`${"=".repeat(80)}`);
    console.log("Payload completo:", JSON.stringify(body, null, 2));
    console.log(`${"=".repeat(80)}\n`);

    try {
      const webhookData = body as {
        tracking?: string;
        status?: string;
        substatus?: string[];
        message?: string;
        created_at?: string;
        occurred_at?: string;
        location?: {
          city?: string;
          state?: string;
        };
        // Campos adicionais que o Melhor Envio pode enviar
        order_id?: string;
        service_id?: number;
        agency?: string;
        protocol?: string;
      };

      const trackingCode = webhookData.tracking;
      const status = webhookData.status;
      const message = webhookData.message || "";
      const substatus = webhookData.substatus || [];

      console.log("📋 Dados extraídos do webhook:");
      console.log(`  - Tracking Code: ${trackingCode}`);
      console.log(`  - Status: ${status}`);
      console.log(`  - Sub-status: ${substatus.join(", ")}`);
      console.log(`  - Mensagem: ${message}`);

      if (!trackingCode) {
        console.error("❌ Código de rastreamento não fornecido no webhook");
        set.status = 400;
        return { error: "Código de rastreamento não fornecido" };
      }

      // Buscar o shipment pelo código de rastreamento
      const shipment = await prisma.shipment.findFirst({
        where: { trackingCode },
        include: { 
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          } 
        },
      });

      if (!shipment) {
        console.warn(`⚠️  Shipment não encontrado para o código: ${trackingCode}`);
        console.warn(`   Tentando buscar por melhorEnvioId...`);
        
        // Tentar buscar pelo melhorEnvioId
        const shipmentByMEId = webhookData.order_id 
          ? await prisma.shipment.findFirst({
              where: { melhorEnvioId: webhookData.order_id },
              include: { 
                order: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      }
                    }
                  }
                } 
              },
            })
          : null;

        if (!shipmentByMEId) {
          set.status = 404;
          return { error: "Envio não encontrado" };
        }
        
        console.log(`✅ Shipment encontrado via melhorEnvioId`);
        // Atualizar o tracking code se estava faltando
        if (!shipmentByMEId.trackingCode) {
          await prisma.shipment.update({
            where: { id: shipmentByMEId.id },
            data: { trackingCode },
          });
          console.log(`📝 Tracking code ${trackingCode} adicionado ao shipment ${shipmentByMEId.id}`);
        }
      }

      const finalShipment = shipment || (await prisma.shipment.findFirst({
        where: webhookData.order_id ? { melhorEnvioId: webhookData.order_id } : undefined,
        include: { 
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          } 
        },
      }));

      if (!finalShipment) {
        set.status = 404;
        return { error: "Envio não encontrado" };
      }

      console.log(`\n✅ Shipment encontrado:`);
      console.log(`  - ID: ${finalShipment.id}`);
      console.log(`  - Order ID: ${finalShipment.orderId}`);
      console.log(`  - Status atual: ${finalShipment.status}`);
      console.log(`  - Cliente: ${finalShipment.order.user.name} (${finalShipment.order.user.email})`);

      // Criar evento de rastreamento
      const location = webhookData.location
        ? `${webhookData.location.city || ""}, ${webhookData.location.state || ""}`.trim()
        : null;

      const trackingEvent = await prisma.trackingEvent.create({
        data: {
          shipmentId: finalShipment.id,
          status: status || "unknown",
          message,
          location: location || undefined,
          date: webhookData.occurred_at
            ? new Date(webhookData.occurred_at)
            : new Date(),
        },
      });

      console.log(`\n📝 Evento de rastreamento criado:`);
      console.log(`  - ID: ${trackingEvent.id}`);
      console.log(`  - Status: ${trackingEvent.status}`);
      console.log(`  - Localização: ${location || "N/A"}`);
      console.log(`  - Data: ${trackingEvent.date.toISOString()}`);

      // Atualizar status do shipment baseado no status recebido
      const updateData: {
        status: string;
        delivered?: boolean;
        deliveredAt?: Date;
        posted?: boolean;
        postedAt?: Date;
        canceled?: boolean;
        canceledAt?: Date;
        trackingCode?: string;
      } = {
        status: status || finalShipment.status,
      };

      // Garantir que o tracking code está salvo
      if (trackingCode && !finalShipment.trackingCode) {
        updateData.trackingCode = trackingCode;
      }

      let orderStatus: string | null = null;

      // Mapear status do Melhor Envio para nosso sistema
      // Referência: https://docs.melhorenvio.com.br/docs/status-de-rastreamento
      const statusLower = status?.toLowerCase() || "";
      
      console.log(`\n🔄 Mapeando status "${status}"...`);

      if (statusLower.includes("delivered") || statusLower.includes("entregue")) {
        updateData.delivered = true;
        updateData.deliveredAt = new Date();
        updateData.status = "delivered";
        orderStatus = "delivered";
        console.log("  ✅ Status mapeado para: DELIVERED (Entregue)");
      } else if (statusLower.includes("posted") || statusLower.includes("postado")) {
        updateData.posted = true;
        updateData.postedAt = new Date();
        updateData.status = "posted";
        orderStatus = "shipped";
        console.log("  📮 Status mapeado para: POSTED (Postado) - Pedido será marcado como SHIPPED");
      } else if (statusLower.includes("cancel") || statusLower.includes("cancelado")) {
        updateData.canceled = true;
        updateData.canceledAt = new Date();
        updateData.status = "canceled";
        orderStatus = "cancelled";
        console.log("  ❌ Status mapeado para: CANCELED (Cancelado)");
      } else if (statusLower.includes("transit") || statusLower.includes("transito")) {
        updateData.status = "in_transit";
        orderStatus = "shipped";
        console.log("  🚚 Status mapeado para: IN_TRANSIT (Em trânsito)");
      } else if (statusLower.includes("out_for_delivery") || statusLower.includes("saiu para entrega")) {
        updateData.status = "out_for_delivery";
        orderStatus = "shipped";
        console.log("  🚗 Status mapeado para: OUT_FOR_DELIVERY (Saiu para entrega)");
      } else if (statusLower.includes("released") || statusLower.includes("liberado")) {
        updateData.status = "released";
        orderStatus = "shipped";
        console.log("  📦 Status mapeado para: RELEASED (Liberado)");
      } else if (statusLower.includes("pending") || statusLower.includes("pendente")) {
        updateData.status = "pending";
        console.log("  ⏳ Status mapeado para: PENDING (Pendente)");
      } else if (statusLower.includes("collecting") || statusLower.includes("coleta")) {
        updateData.status = "collecting";
        orderStatus = "processing";
        console.log("  📥 Status mapeado para: COLLECTING (Em coleta)");
      } else {
        updateData.status = status || "unknown";
        console.log(`  ℹ️  Status mantido como recebido: ${status || "unknown"}`);
      }

      // Atualizar shipment
      const updatedShipment = await prisma.shipment.update({
        where: { id: finalShipment.id },
        data: updateData,
      });

      console.log(`\n✅ Shipment ${finalShipment.id} atualizado:`);
      console.log(`  - Novo status: ${updatedShipment.status}`);
      console.log(`  - Posted: ${updatedShipment.posted}`);
      console.log(`  - Delivered: ${updatedShipment.delivered}`);
      console.log(`  - Canceled: ${updatedShipment.canceled}`);

      // Atualizar status do pedido
      let updatedOrder = null;
      if (orderStatus) {
        const currentOrderStatus = finalShipment.order.status;
        
        // Evitar regressões de status (ex: não mudar de "delivered" para "shipped")
        const statusPriority: { [key: string]: number } = {
          pending: 1,
          processing: 2,
          shipped: 3,
          delivered: 4,
          cancelled: 5,
        };

        const currentPriority = statusPriority[currentOrderStatus] || 0;
        const newPriority = statusPriority[orderStatus] || 0;

        if (newPriority > currentPriority || orderStatus === "cancelled") {
          updatedOrder = await prisma.order.update({
            where: { id: finalShipment.orderId },
            data: { 
              status: orderStatus,
              shippingTrackingCode: trackingCode || finalShipment.order.shippingTrackingCode,
            },
          });
          
          console.log(`\n🔄 Pedido ${finalShipment.orderId} atualizado:`);
          console.log(`  - Status anterior: ${currentOrderStatus}`);
          console.log(`  - Novo status: ${orderStatus}`);
          console.log(`  - Tracking code: ${trackingCode || finalShipment.order.shippingTrackingCode || "N/A"}`);
        } else {
          console.log(`\n⚠️  Status do pedido não atualizado (evitando regressão):`);
          console.log(`  - Status atual: ${currentOrderStatus} (prioridade ${currentPriority})`);
          console.log(`  - Status recebido: ${orderStatus} (prioridade ${newPriority})`);
        }
      }

      console.log(`\n${"=".repeat(80)}`);
      console.log("✅ WEBHOOK PROCESSADO COM SUCESSO");
      console.log(`${"=".repeat(80)}\n`);

      return {
        success: true,
        message: "Webhook processado com sucesso",
        data: {
          shipmentId: finalShipment.id,
          orderId: finalShipment.orderId,
          trackingCode: trackingCode,
          shipmentStatus: updatedShipment.status,
          orderStatus: updatedOrder?.status || finalShipment.order.status,
          trackingEventId: trackingEvent.id,
          statusUpdated: !!orderStatus,
          delivered: updatedShipment.delivered,
          posted: updatedShipment.posted,
          canceled: updatedShipment.canceled,
        },
      };
    } catch (e: unknown) {
      console.error("\n" + "=".repeat(80));
      console.error("❌ ERRO AO PROCESSAR WEBHOOK DO MELHOR ENVIO");
      console.error("=".repeat(80));
      console.error("Erro:", e);
      console.error("Stack:", e instanceof Error ? e.stack : "N/A");
      console.error("=".repeat(80) + "\n");
      
      set.status = 500;
      return {
        success: false,
        error: "Erro ao processar webhook",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  })

  // Webhook genérico do Melhor Envio (para outros eventos)
  .post("/api/webhooks/melhor-envio", async ({ body, set }) => {
    console.log("📬 Webhook Melhor Envio (genérico) recebido:", JSON.stringify(body, null, 2));

    try {
      // Log para debug - adicionar lógica específica conforme necessário
      const webhookData = body as {
        event?: string;
        order_id?: string;
        tracking?: string;
      };

      console.log("Evento:", webhookData.event);
      console.log("Order ID:", webhookData.order_id);
      console.log("Tracking:", webhookData.tracking);

      return {
        success: true,
        message: "Webhook recebido",
      };
    } catch (e: unknown) {
      console.error("❌ Erro ao processar webhook genérico:", e);
      set.status = 500;
      return {
        error: "Erro ao processar webhook",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  })

  // ===== SINCRONIZAÇÃO MELHOR ENVIO =====
  // Rota para sincronizar pedidos com Melhor Envio (admin only)
  .post("/api/sync-orders", async ({ request, set }) => {
    const cookies = cookie.parse(request.headers.get("cookie") || "");
    const token = cookies.token;

    if (!token) {
      set.status = 401;
      return { error: "Não autenticado." };
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        role: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.role !== "admin") {
        set.status = 403;
        return { error: "Acesso negado. Apenas administradores." };
      }

      console.log('\n🔄 Iniciando sincronização de pedidos via API...\n');

      // Buscar todos os pedidos com shipment e melhorEnvioId
      const ordersWithShipment = await prisma.order.findMany({
        where: {
          shipment: {
            melhorEnvioId: {
              not: null,
            },
          },
        },
        include: {
          shipment: true,
        },
        orderBy: {
          id: 'desc',
        },
      });

      if (ordersWithShipment.length === 0) {
        return {
          success: true,
          message: 'Nenhum pedido para sincronizar',
          synchronized: 0,
          errors: 0,
        };
      }

      const melhorEnvio = getMelhorEnvioService();
      let successCount = 0;
      let errorCount = 0;
      const errors: { orderId: number; error: string }[] = [];

      for (const order of ordersWithShipment) {
        if (!order.shipment?.melhorEnvioId) continue;

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const orderInfo = await melhorEnvio.getOrder(order.shipment.melhorEnvioId) as any;

          // Preparar dados para atualização do shipment
          const updateData: {
            trackingCode?: string;
            status: string;
            protocol?: string;
            serviceName?: string;
            carrier?: string;
            posted?: boolean;
            postedAt?: Date;
            delivered?: boolean;
            deliveredAt?: Date;
            canceled?: boolean;
            canceledAt?: Date;
          } = {
            status: orderInfo.status || 'pending',
          };

          if (orderInfo.tracking) updateData.trackingCode = orderInfo.tracking;
          if (orderInfo.protocol) updateData.protocol = orderInfo.protocol;
          if (orderInfo.service) {
            updateData.serviceName = orderInfo.service.name;
            if (orderInfo.service.company) {
              updateData.carrier = orderInfo.service.company.name;
            }
          }
          if (orderInfo.posted_at) {
            updateData.posted = true;
            updateData.postedAt = new Date(orderInfo.posted_at);
          }
          if (orderInfo.delivered_at) {
            updateData.delivered = true;
            updateData.deliveredAt = new Date(orderInfo.delivered_at);
          }
          if (orderInfo.canceled_at) {
            updateData.canceled = true;
            updateData.canceledAt = new Date(orderInfo.canceled_at);
          }

          // Atualizar shipment
          await prisma.shipment.update({
            where: { id: order.shipment.id },
            data: updateData,
          });

          // Atualizar pedido
          const orderUpdateData: {
            shippingTrackingCode?: string;
            status?: string;
          } = {};

          if (updateData.trackingCode) {
            orderUpdateData.shippingTrackingCode = updateData.trackingCode;
          }

          if (orderInfo.status === 'delivered') {
            orderUpdateData.status = 'delivered';
          } else if (orderInfo.status === 'posted' || orderInfo.status === 'in_transit') {
            orderUpdateData.status = 'shipped';
          } else if (orderInfo.status === 'canceled') {
            orderUpdateData.status = 'cancelled';
          }

          if (Object.keys(orderUpdateData).length > 0) {
            await prisma.order.update({
              where: { id: order.id },
              data: orderUpdateData,
            });
          }

          successCount++;
          console.log(`✅ Pedido #${order.id} sincronizado`);

        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ orderId: order.id, error: errorMessage });
          console.error(`❌ Erro ao sincronizar pedido #${order.id}:`, errorMessage);
        }

        // Aguardar 300ms entre requisições
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log(`\n✅ Sincronização concluída: ${successCount} sucesso, ${errorCount} erros\n`);

      return {
        success: true,
        message: 'Sincronização concluída',
        total: ordersWithShipment.length,
        synchronized: successCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
      };

    } catch (e: unknown) {
      console.error("❌ Erro ao sincronizar pedidos:", e);
      set.status = 500;
      return {
        success: false,
        error: "Erro ao sincronizar pedidos",
        details: e instanceof Error ? e.message : String(e),
      };
    }
  });

export const handler = app.handle;
