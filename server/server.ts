import { Elysia } from "elysia";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { prisma } from "../src/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado nas variáveis de ambiente. Configure a variável JWT_SECRET no arquivo .env");
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
      password: z.string()
        .min(8)
        .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
        .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
        .regex(/\d/, "Senha deve conter pelo menos um número"),
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: parsed.error.issues[0]?.message || "Dados inválidos" };
    }

    const { name, email, password } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        set.status = 409;
        return { error: "E-Mail já cadastrado." };
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashed },
      });

      return { id: user.id, name: user.name, email: user.email };
    } catch (e: unknown) {
      set.status = 500;
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

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        set.status = 404;
        return { error: "Usuário não encontrado." };
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

      return {
        message: "Login bem-sucedido.",
        user: { id: user.id, email: user.email },
      };
    } catch (e: unknown) {
      set.status = 500;
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
      };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
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
      set.status = 500;
      return { error: "Erro ao deletar usuário" };
    }
  });

export const handler = app.handle;
