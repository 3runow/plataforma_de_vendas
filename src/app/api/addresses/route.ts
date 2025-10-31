import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressCreateSchema = z.object({
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

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar dados com Zod
    const validationResult = addressCreateSchema.safeParse(body);
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
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        name: data.name || null,
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
    console.error("Erro ao criar endereço:", error);
    return NextResponse.json(
      { error: "Erro ao criar endereço" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: {
        isDefault: "desc",
      },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar endereços" },
      { status: 500 }
    );
  }
}
