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
    const { cartItems } = body;

    console.log("=== SINCRONIZANDO CARRINHO ===");
    console.log("Usuário:", user.id);
    console.log("Itens do localStorage:", cartItems?.length || 0);

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Carrinho vazio",
        cartItems: [],
      });
    }

    // Limpar carrinho atual do banco
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });

    console.log("Carrinho anterior limpo");

    // Agrupar itens por produto para evitar duplicatas
    const groupedItems = cartItems.reduce(
      (acc, item) => {
        const productId = parseInt(item.productId);
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

    console.log("Itens agrupados:", Object.values(groupedItems));

    // Adicionar itens agrupados ao banco
    const createdItems = [];
    for (const item of Object.values(groupedItems)) {
      try {
        const cartItem = await prisma.cartItem.create({
          data: {
            userId: user.id,
            productId: item.productId,
            quantity: item.quantity,
          },
          include: { product: true },
        });
        createdItems.push(cartItem);
        console.log(
          `Item adicionado: produto ${item.productId}, quantidade ${item.quantity}`
        );
      } catch (error) {
        console.error(`Erro ao adicionar item ${item.productId}:`, error);
      }
    }

    console.log(`Sincronização concluída: ${createdItems.length} itens`);

    return NextResponse.json({
      success: true,
      message: `Carrinho sincronizado com ${createdItems.length} itens`,
      cartItems: createdItems,
    });
  } catch (error) {
    console.error("Erro ao sincronizar carrinho:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar carrinho" },
      { status: 500 }
    );
  }
}
