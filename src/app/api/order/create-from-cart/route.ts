import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("Iniciando criação de pedido do carrinho...");

    const user = await verifyAuth(request);
    if (!user) {
      console.log("Usuário não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("Usuário autenticado:", user.id);

    // Buscar itens do carrinho
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      console.log("Carrinho vazio para usuário:", user.id);
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    console.log("Itens do carrinho:", cartItems.length);

    // Buscar endereço padrão do usuário ou qualquer endereço
    let defaultAddress = await prisma.address.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
      },
    });

    if (!defaultAddress) {
      console.log(
        "Nenhum endereço padrão encontrado, buscando qualquer endereço..."
      );
      defaultAddress = await prisma.address.findFirst({
        where: {
          userId: user.id,
        },
      });
    }

    if (!defaultAddress) {
      console.log("Nenhum endereço encontrado para usuário:", user.id);
      return NextResponse.json(
        {
          error:
            "Nenhum endereço encontrado. Por favor, adicione um endereço primeiro.",
        },
        { status: 400 }
      );
    }

    console.log("Endereço padrão encontrado:", defaultAddress.id);

    // Calcular total
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const shipping = 11.82; // Frete fixo por enquanto
    const total = subtotal + shipping;

    console.log("Total calculado:", total);

    // Verificar estoque
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para o produto ${item.product.name}. Disponível: ${item.product.stock}, Solicitado: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Criar o pedido
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        addressId: defaultAddress.id,
        total,
        status: "pending",
        shippingService: "Correios",
        shippingPrice: shipping,
        shippingDeliveryTime: 5,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
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
      userId: order.userId,
      total: order.total,
      itemsCount: order.items.length,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        status: order.status,
        items: order.items,
        address: order.address,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pedido do carrinho:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json(
      {
        error: "Erro ao criar pedido",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
