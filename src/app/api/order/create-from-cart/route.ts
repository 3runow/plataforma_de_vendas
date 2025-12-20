import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";
import { buildOrderConfirmationEmail, sendEmail } from "@/lib/email";

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

    // Criar o pedido e reduzir o estoque em uma transação
    const order = await prisma.$transaction(async (tx) => {
      // 1. Criar o pedido
      const createdOrder = await tx.order.create({
        data: {
          userId: user.id,
          addressId: defaultAddress.id,
          total,
          status: "payment_pending",
          paymentStatus: "pending",
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

      // 2. Reduzir o estoque de cada produto
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        console.log(`✅ Estoque do produto ${item.productId} reduzido em ${item.quantity} unidades`);
      }

      // 3. Limpar o carrinho do usuário
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });

      return createdOrder;
    });

    console.log("Pedido criado com sucesso:", {
      id: order.id,
      userId: order.userId,
      total: order.total,
      itemsCount: order.items.length,
    });

    // Enviar e-mail de confirmação de pedido
    try {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (userData?.email) {
        const html = buildOrderConfirmationEmail({
          customerName: userData.name || "Cliente",
          orderId: order.id,
          orderTotal: Number(order.total),
          paymentMethod: "Pagamento via Bricks", // pode ser ajustado depois com o método real
          items: order.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: Number(item.price),
            imageUrl:
              (item.product as unknown as { mainImageUrl?: string | null })
                .mainImageUrl || undefined,
          })),
        });

        await sendEmail({
          to: userData.email,
          subject: `Seu pedido #${order.id} foi recebido - Bricks`,
          html,
          text: `Olá, ${
            userData.name || "cliente"
          }! Recebemos o seu pedido #${order.id}. Total: R$ ${order.total}.`,
        });

        console.log("E-mail de confirmação de pedido enviado para", userData.email);
      } else {
        console.warn(
          "Usuário sem e-mail cadastrado, não foi possível enviar confirmação.",
          user.id
        );
      }
    } catch (emailError) {
      console.error("Erro ao enviar e-mail de confirmação de pedido:", emailError);
    }

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
