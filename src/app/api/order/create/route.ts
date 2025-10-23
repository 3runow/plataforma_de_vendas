import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { address, items, shipping, total } = body;

    // Cria o endereço se necessário
    let addressId = address.id;
    if (!addressId) {
      if (!address.recipientName) {
        return NextResponse.json(
          { error: "recipientName é obrigatório para criar endereço" },
          { status: 400 }
        );
      }
      const addressCreated = await prisma.address.create({
        data: {
          ...address,
          userId: user.id,
          recipientName: address.recipientName,
        },
      });
      addressId = addressCreated.id;
    }

    // Cria o pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId,
        total,
        status: "pending",
        shippingService: shipping?.company || null,
        shippingPrice: shipping?.price || null,
        shippingDeliveryTime: shipping?.deliveryTime || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        address: true,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}
