import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// Vincula pedidos de um guest (por email) ao usuário autenticado
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { guestEmail, orderId } = body;

    // Buscar o usuário autenticado com email
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true },
    });

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Se foi passado um orderId específico, vincular apenas esse pedido
    if (orderId) {
      const orderIdNum = typeof orderId === "string" ? parseInt(orderId) : orderId;
      
      const order = await prisma.order.findUnique({
        where: { id: orderIdNum },
        include: { user: true },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 }
        );
      }

      // Verificar se o pedido pertence a um guest
      if (!order.user?.isGuest) {
        return NextResponse.json(
          { error: "Este pedido não pode ser vinculado" },
          { status: 400 }
        );
      }

      // Verificar se o email do guest corresponde ao do usuário autenticado
      if (order.user.email.toLowerCase() !== authenticatedUser.email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email não corresponde ao do pedido" },
          { status: 403 }
        );
      }

      // Atualizar o pedido para o usuário autenticado
      await prisma.order.update({
        where: { id: orderIdNum },
        data: { userId: user.id },
      });

      // Atualizar endereços do pedido para o novo usuário
      if (order.addressId) {
        await prisma.address.update({
          where: { id: order.addressId },
          data: { userId: user.id },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Pedido vinculado com sucesso",
        linkedOrders: 1,
      });
    }

    // Se foi passado guestEmail, vincular todos os pedidos desse guest
    const emailToSearch = guestEmail?.toLowerCase() || authenticatedUser.email.toLowerCase();

    // Buscar o usuário guest pelo email
    const guestUser = await prisma.user.findFirst({
      where: {
        email: { equals: emailToSearch, mode: "insensitive" },
        isGuest: true,
        id: { not: user.id }, // Não é o próprio usuário
      },
    });

    if (!guestUser) {
      // Não há pedidos de guest para vincular
      return NextResponse.json({
        success: true,
        message: "Nenhum pedido de guest encontrado para vincular",
        linkedOrders: 0,
      });
    }

    // Buscar todos os pedidos do guest
    const guestOrders = await prisma.order.findMany({
      where: { userId: guestUser.id },
      include: { address: true },
    });

    if (guestOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum pedido encontrado",
        linkedOrders: 0,
      });
    }

    // Vincular todos os pedidos ao usuário autenticado
    await prisma.$transaction(async (tx) => {
      // Atualizar todos os pedidos
      await tx.order.updateMany({
        where: { userId: guestUser.id },
        data: { userId: user.id },
      });

      // Atualizar todos os endereços associados aos pedidos
      const addressIds = guestOrders
        .map((order) => order.addressId)
        .filter((id): id is number => id !== null);

      if (addressIds.length > 0) {
        await tx.address.updateMany({
          where: { id: { in: addressIds } },
          data: { userId: user.id },
        });
      }

      // Atualizar itens do carrinho do guest
      await tx.cartItem.updateMany({
        where: { userId: guestUser.id },
        data: { userId: user.id },
      });
    });

    console.log(
      `✅ ${guestOrders.length} pedido(s) do guest ${guestUser.email} vinculados ao usuário ${authenticatedUser.email}`
    );

    return NextResponse.json({
      success: true,
      message: `${guestOrders.length} pedido(s) vinculado(s) com sucesso`,
      linkedOrders: guestOrders.length,
    });
  } catch (error) {
    console.error("Erro ao vincular pedidos:", error);
    return NextResponse.json(
      { error: "Erro ao vincular pedidos" },
      { status: 500 }
    );
  }
}
