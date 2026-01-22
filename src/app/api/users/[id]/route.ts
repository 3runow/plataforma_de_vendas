import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";

// Schema de validação para atualização de usuário
const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(["customer", "visitor", "admin"]).optional(),
});

// PUT: Atualizar usuário (nome, email, role)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas admin pode atualizar usuários
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem atualizar usuários." },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    const body = await request.json();

    // Validar dados
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Preparar dados para atualizar
    const updateData: {
      name?: string;
      email?: string;
      role?: string;
    } = {};

    if (validationResult.data.name) {
      updateData.name = validationResult.data.name;
    }
    if (validationResult.data.email) {
      updateData.email = validationResult.data.email;
    }
    if (validationResult.data.role) {
      updateData.role = validationResult.data.role;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Usuário atualizado com sucesso",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE: Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas admin pode deletar usuários
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem deletar usuários." },
        { status: 403 }
      );
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    // Evitar deletar a si mesmo
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Você não pode deletar sua própria conta" },
        { status: 400 }
      );
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao deletar usuário" },
      { status: 500 }
    );
  }
}

// GET: Obter dados de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    // Apenas admin pode ver dados de outros usuários
    if (user.role !== "admin" && user.id !== userId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuário" },
      { status: 500 }
    );
  }
}
