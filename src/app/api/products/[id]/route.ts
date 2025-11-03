import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const productUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().max(999999.99).optional(),
  stock: z.number().int().min(0).max(999999).optional(),
  imageUrl: z
    .union([
      z.string().url(),
      z.string().startsWith("/"),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  imageUrls: z
    .union([
      z.array(z.union([z.string().url(), z.string().startsWith("/")])),
      z.null(),
    ])
    .optional(),
  discount: z.number().min(0).max(100).optional().nullable(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID do produto inválido" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem atualizar produtos.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID do produto inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    console.log(
      "Dados recebidos para atualização:",
      JSON.stringify(body, null, 2)
    );

    // Validar dados com Zod
    const validationResult = productUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Erros de validação:", validationResult.error.issues);
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

    // Limpar dados antes de enviar ao Prisma
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanData: any = { ...validationResult.data };

    // Converter string vazia em null para imageUrl
    if (cleanData.imageUrl === "") {
      cleanData.imageUrl = null;
    }

    // Converter null em undefined para imageUrls (Prisma não aceita null para arrays)
    if (cleanData.imageUrls === null) {
      delete cleanData.imageUrls;
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: cleanData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticação
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é admin
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem deletar produtos.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID do produto inválido" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return NextResponse.json(
      { error: "Erro ao deletar produto" },
      { status: 500 }
    );
  }
}
