import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Busca o usuário com seus endereços
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        addresses: {
          orderBy: { isDefault: "desc" },
          take: 1, // Pegar apenas o endereço padrão ou o primeiro
        },
      },
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar informações do usuário" },
      { status: 500 }
    );
  }
}
