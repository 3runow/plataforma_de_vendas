import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userUpdateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  cpf: z.string().regex(/^\d{11}$/).optional().nullable(),
  phone: z.string().regex(/^\d{10,11}$/).optional().nullable(),
});

export async function PUT(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados com Zod
    const validationResult = userUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Dados inválidos",
          details: validationResult.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { name, email, cpf, phone } = validationResult.data;

    // verifica se o email já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 400 }
        );
      }
    }

    // verifica se o CPF já está em uso por outro usuário
    if (cpf) {
      const existingUser = await prisma.user.findFirst({
        where: {
          cpf,
          NOT: {
            id: user.id,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Este CPF já está em uso" },
          { status: 400 }
        );
      }
    }

    // atualiza o usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        cpf: cpf || null,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar informações" },
      { status: 500 }
    );
  }
}
