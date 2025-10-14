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

    const data = await request.json();

    // se for definido como padrão, remover o padrão dos outros endereços
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
          NOT: {
            id: addressId,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        recipientName: data.recipientName,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        isDefault: data.isDefault || false,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar endereço" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: "Endereço excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir endereço:", error);
    return NextResponse.json(
      { error: "Erro ao excluir endereço" },
      { status: 500 }
    );
  }
}
