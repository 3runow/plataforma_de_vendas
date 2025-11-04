import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  recipientName: z.string().min(2).max(100),
  cep: z.string().regex(/^\d{8}$/),
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional().nullable(),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().length(2).regex(/^[A-Z]{2}$/),
  isDefault: z.boolean().optional(),
});

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
    
    if (isNaN(addressId)) {
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

    const body = await request.json();
    
    // Validar dados com Zod
    const validationResult = addressUpdateSchema.safeParse(body);
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

    const data = validationResult.data;

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
    
    if (isNaN(addressId)) {
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

    // Verifica se há pedidos associados a este endereço
    const ordersCount = await prisma.order.count({
      where: {
        addressId: addressId,
      },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir este endereço porque existem pedidos associados a ele. Exclua os pedidos primeiro ou escolha outro endereço como padrão.",
          hasOrders: true,
          ordersCount,
        },
        { status: 400 }
      );
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ message: "Endereço excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir endereço:", error);

    // Verifica se é erro de constraint de chave estrangeira
    if (
      error instanceof Error &&
      error.message.includes("Foreign key constraint")
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível excluir este endereço porque há pedidos associados a ele.",
          hasOrders: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao excluir endereço" },
      { status: 500 }
    );
  }
}
