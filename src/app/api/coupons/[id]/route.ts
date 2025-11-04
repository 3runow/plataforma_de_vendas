import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// DELETE - Deletar cupom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Cupom deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar cupom:", error);
    return NextResponse.json(
      { error: "Erro ao deletar cupom" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar cupom
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { code, discount, isActive, expiresAt, usageLimit } = body;

    const updateData: Record<string, unknown> = {};

    if (code) updateData.code = code.toUpperCase();
    if (discount !== undefined) {
      if (discount <= 0 || discount > 100) {
        return NextResponse.json(
          { error: "Desconto deve ser entre 0 e 100%" },
          { status: 400 }
        );
      }
      updateData.discount = parseFloat(discount);
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (usageLimit !== undefined)
      updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;

    const coupon = await prisma.coupon.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Erro ao atualizar cupom:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cupom" },
      { status: 500 }
    );
  }
}
