import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// GET - Listar todos os cupons (apenas admin)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || "secret") as {
      userId: number;
      role: string;
    };

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Erro ao buscar cupons:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cupons" },
      { status: 500 }
    );
  }
}

// POST - Criar novo cupom (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || "secret") as {
      userId: number;
      role: string;
    };

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { code, discount, isActive, expiresAt, usageLimit } = body;

    if (!code || !discount) {
      return NextResponse.json(
        { error: "Código e desconto são obrigatórios" },
        { status: 400 }
      );
    }

    if (discount <= 0 || discount > 100) {
      return NextResponse.json(
        { error: "Desconto deve ser entre 0 e 100%" },
        { status: 400 }
      );
    }

    // Verificar se o cupom já existe
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
      return NextResponse.json({ error: "Cupom já existe" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        isActive: isActive ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cupom:", error);
    return NextResponse.json({ error: "Erro ao criar cupom" }, { status: 500 });
  }
}
