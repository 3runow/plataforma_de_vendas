import { Elysia } from "elysia";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { prisma } from "../src/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret"; // colocar no .env

const app = new Elysia()
  // retorna JSON consistente para erros não tratados
  .onError(({ error, set }) => {
    set.status = 500;
    const message =
      (error as any)?.message ?? String(error ?? "Erro interno do servidor");
    return { error: message };
  })
  // registro
  .post("/api/register", async ({ body, set }: { body: any; set: any }) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
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
    } catch (e: any) {
      set.status = 500;
      return { error: "Erro ao criar usuário" };
    }
  })

  // login
  .post("/api/login", async ({ body, set }: { body: any; set: any }) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
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
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      set.headers["Set-Cookie"] = cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return {
        message: "Login bem-sucedido.",
        user: { id: user.id, email: user.email },
      };
    } catch (e: any) {
      set.status = 500;
      return { error: "Erro ao realizar login" };
    }
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
      };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      return { user };
    } catch {
      return { error: "Token inválido." };
    }
  });

export const handler = app.handle;
