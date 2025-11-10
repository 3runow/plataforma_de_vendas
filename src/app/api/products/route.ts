import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().positive().max(999999.99),
  stock: z.number().int().min(0).max(999999),
  imageUrl: z.string().url().optional().nullable(),
  imageUrls: z.array(z.string().url()).optional().nullable(),
  discount: z.number().min(0).max(100).optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  pieces: z.number().int().min(1).optional().nullable(),
  dimensions: z.string().max(255).optional().nullable(),
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
          error: "Acesso negado. Apenas administradores podem criar produtos.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar dados com Zod
    const validationResult = productSchema.safeParse(body);
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

    // Limpar dados antes de criar produto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productData: any = { ...validationResult.data };

    // Converter null em undefined para imageUrls (Prisma não aceita null para arrays)
    if (productData.imageUrls === null) {
      delete productData.imageUrls;
    }

    const product = await prisma.product.create({
      data: productData,
    });

    return NextResponse.json({
      ...product,
      id: product.id.toString(),
    });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
