import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("=== CRIANDO PEDIDO ROBUSTO ===");
    console.log("Usuário:", user.id);

    // 1. Buscar itens do carrinho
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    console.log("Itens do carrinho encontrados:", cartItems.length);

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // 2. Verificar estoque
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para ${item.product.name}. Disponível: ${item.product.stock}, Solicitado: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Buscar endereço do usuário
    const address = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });

    if (!address) {
      return NextResponse.json(
        { error: "Nenhum endereço encontrado" },
        { status: 400 }
      );
    }

    console.log("Endereço encontrado:", address.id);

    // 4. Calcular totais
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shipping = 15.0; // Frete fixo por enquanto
    const total = subtotal + shipping;

    console.log("Totais calculados:", { subtotal, shipping, total });

    // 5. Criar pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: address.id,
        total,
        status: "pending",
        paymentStatus: "pending",
        shippingService: "Correios",
        shippingPrice: shipping,
        shippingDeliveryTime: 5,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
      },
    });

    console.log("Pedido criado com sucesso:", {
      id: order.id,
      total: order.total,
      itemsCount: order.items.length,
    });

    // 6. Reduzir estoque
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
      console.log(
        `Estoque reduzido: produto ${item.productId}, quantidade: ${item.quantity}`
      );
    }

    // 7. Limpar carrinho
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    console.log("Carrinho limpo");

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items,
        address: order.address,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pedido robusto:", error);
    return NextResponse.json(
      {
        error: "Erro ao criar pedido",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
