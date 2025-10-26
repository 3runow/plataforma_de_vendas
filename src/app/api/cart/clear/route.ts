import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("Limpando carrinho para usuário:", user.id);

    // Limpar todos os itens do carrinho do usuário
    const result = await prisma.cartItem.deleteMany({
      where: {
        userId: user.id,
      },
    });

    console.log(`Removidos ${result.count} itens do carrinho`);

    return NextResponse.json({
      success: true,
      message: "Carrinho limpo com sucesso",
      removedItems: result.count,
    });
  } catch (error) {
    console.error("Erro ao limpar carrinho:", error);
    return NextResponse.json(
      {
        error: "Erro ao limpar carrinho",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
