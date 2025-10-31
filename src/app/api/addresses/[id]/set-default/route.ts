import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const addressId = parseInt(id);

    // Validar addressId
    if (isNaN(addressId) || addressId <= 0) {
      return NextResponse.json(
        { error: "ID do endereço inválido" },
        { status: 400 }
      );
    }

    // verifica se o endereço pertence ao usuário
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: "Endereço não encontrado" },
        { status: 404 }
      );
    }

    // remove o padrão dos outros endereços
    await prisma.address.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // define este endereço como padrão
    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        isDefault: true,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("Erro ao definir endereço padrão:", error);
    return NextResponse.json(
      { error: "Erro ao definir endereço padrão" },
      { status: 500 }
    );
  }
}
