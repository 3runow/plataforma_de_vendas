import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Lock global para prevenir chamadas duplas
const orderCreationLocks = new Map<number, boolean>();

export async function POST(request: NextRequest) {
  let user: { id: number; email: string; role?: string; name?: string } | null =
    null;

  try {
    console.log("=== CRIANDO PEDIDO SIMPLES ===");

    user = await verifyAuth(request);
    if (!user) {
      console.log("Usuário não autorizado");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("Usuário autenticado:", user.id);
    console.log("Timestamp da requisição:", new Date().toISOString());

    // Verificar se já existe um lock para este usuário
    if (orderCreationLocks.get(user.id)) {
      console.log("Lock ativo para usuário", user.id, "- aguardando...");

      // Aguardar um pouco e verificar novamente
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (orderCreationLocks.get(user.id)) {
        console.log(
          "Lock ainda ativo para usuário",
          user.id,
          "- retornando erro"
        );
        return NextResponse.json(
          { error: "Pedido já está sendo processado" },
          { status: 409 }
        );
      }
    }

    // Definir lock para este usuário
    orderCreationLocks.set(user.id, true);
    console.log("Lock definido para usuário", user.id);

    try {
      // Verificar se já existe um pedido recente (últimos 30 segundos) para evitar duplicatas
      const recentOrder = await prisma.order.findFirst({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(Date.now() - 30000), // 30 segundos atrás
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (recentOrder) {
        console.log(
          "Pedido recente encontrado, evitando duplicata:",
          recentOrder.id,
          "criado em:",
          recentOrder.createdAt
        );
        return NextResponse.json({
          success: true,
          order: {
            id: recentOrder.id,
            total: recentOrder.total,
            status: recentOrder.status,
            paymentStatus: recentOrder.paymentStatus,
          },
        });
      }

      // Buscar itens do carrinho
      let cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      });

      console.log("Itens do carrinho no banco:", cartItems.length);
      console.log(
        "Detalhes dos itens:",
        cartItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }))
      );

      // Se o carrinho estiver vazio no banco, tentar sincronizar com localStorage
      if (cartItems.length === 0) {
        console.log(
          "Carrinho vazio no banco - tentando sincronizar com localStorage"
        );

        // Buscar itens do localStorage via request body
        const body = await request.json().catch(() => ({}));
        const localStorageItems = body.cartItems || [];

        if (localStorageItems.length > 0) {
          console.log(
            "Itens encontrados no localStorage:",
            localStorageItems.length
          );

          // Limpar carrinho atual do banco primeiro
          await prisma.cartItem.deleteMany({
            where: { userId: user.id },
          });
          console.log("Carrinho anterior limpo");

          // Agrupar itens por produto para evitar duplicatas
          const groupedItems = localStorageItems.reduce(
            (
              acc: Record<number, { productId: number; quantity: number }>,
              item: { productId: number | string; quantity: number }
            ) => {
              const productId =
                typeof item.productId === "string"
                  ? parseInt(item.productId)
                  : item.productId;
              if (acc[productId]) {
                acc[productId].quantity += item.quantity;
              } else {
                acc[productId] = {
                  productId,
                  quantity: item.quantity,
                };
              }
              return acc;
            },
            {} as Record<number, { productId: number; quantity: number }>
          );

          console.log(
            "Itens agrupados para sincronização:",
            Object.values(groupedItems)
          );

          // Sincronizar com banco - criar itens agrupados
          for (const item of Object.values(groupedItems) as {
            productId: number;
            quantity: number;
          }[]) {
            try {
              await prisma.cartItem.create({
                data: {
                  userId: user.id,
                  productId: item.productId,
                  quantity: item.quantity,
                },
              });
              console.log(
                `Item sincronizado: produto ${item.productId}, quantidade ${item.quantity}`
              );
            } catch (error) {
              console.error(
                `Erro ao sincronizar item ${item.productId}:`,
                error
              );
            }
          }

          // Buscar itens sincronizados
          cartItems = await prisma.cartItem.findMany({
            where: { userId: user.id },
            include: { product: true },
          });

          console.log("Itens sincronizados:", cartItems.length);
        }
      }

      if (cartItems.length === 0) {
        console.log("Carrinho vazio - criando pedido de teste");

        // Se carrinho vazio, criar um pedido de teste com produto padrão
        const testProduct = await prisma.product.findFirst();

        if (!testProduct) {
          return NextResponse.json(
            { error: "Nenhum produto disponível" },
            { status: 400 }
          );
        }

        // Buscar endereço
        const address = await prisma.address.findFirst({
          where: { userId: user.id },
        });

        if (!address) {
          return NextResponse.json(
            { error: "Nenhum endereço encontrado" },
            { status: 400 }
          );
        }

        // Criar pedido de teste
        const order = await prisma.order.create({
          data: {
            userId: user.id,
            addressId: address.id,
            total: testProduct.price + 15.0,
            status: "processing",
            paymentStatus: "approved",
            shippingService: "Correios",
            shippingPrice: 15.0,
            shippingDeliveryTime: 5,
            items: {
              create: [
                {
                  productId: testProduct.id,
                  quantity: 1,
                },
              ],
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

        console.log("Pedido de teste criado:", order.id);

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
      }

      // Se tem itens no carrinho, processar normalmente
      console.log("Processando carrinho com", cartItems.length, "itens");

      // Verificar estoque
      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `Estoque insuficiente para ${item.product.name}`,
            },
            { status: 400 }
          );
        }
      }

      // Buscar endereço
      const address = await prisma.address.findFirst({
        where: { userId: user.id },
      });

      console.log("Endereço encontrado:", address ? address.id : "Nenhum");

      if (!address) {
        return NextResponse.json(
          {
            error:
              "Nenhum endereço encontrado. Por favor, cadastre um endereço primeiro.",
          },
          { status: 400 }
        );
      }

      // Calcular total
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const shipping = 15.0;
      const total = subtotal + shipping;

      console.log("Totais:", { subtotal, shipping, total });
      console.log(
        "Itens que serão criados no pedido:",
        cartItems.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }))
      );

      // Criar pedido
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          total,
          status: "processing",
          paymentStatus: "approved",
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

      console.log("Pedido criado:", order.id);
      console.log(
        "Itens criados no pedido:",
        order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }))
      );

      // Reduzir estoque
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Limpar carrinho
      await prisma.cartItem.deleteMany({
        where: { userId: user.id },
      });

      console.log("Processo concluído com sucesso");

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
    } finally {
      // Remover lock do usuário
      orderCreationLocks.delete(user.id);
      console.log("Lock removido para usuário", user.id);
    }
  } catch (error) {
    console.error("Erro ao criar pedido simples:", error);

    // Remover lock em caso de erro
    if (user) {
      orderCreationLocks.delete(user.id);
      console.log("Lock removido para usuário", user.id, "após erro");
    }

    return NextResponse.json(
      {
        error: "Erro ao criar pedido",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
