import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("Buscando pedidos para usuário:", user.id);

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            orderId: true,
            product: true,
          },
        },
        address: true,
      },
    });

    console.log(
      `Encontrados ${orders.length} pedidos para o usuário ${user.id}`
    );
    console.log(
      "Pedidos:",
      orders.map((o) => ({
        id: o.id,
        status: o.status,
        paymentStatus: o.paymentStatus,
      }))
    );

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos" },
      { status: 500 }
    );
  }
}
