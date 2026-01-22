import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

function onlyDigits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

// Busca pedido por ID - permite acesso ao próprio pedido do guest usando email ou acesso autenticado
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "ID do pedido inválido" },
        { status: 400 }
      );
    }

    // Tenta autenticar o usuário
    const user = await verifyAuth(request).catch(() => null);

    const emailParam = request.nextUrl.searchParams.get("email")
      ?.trim()
      .toLowerCase();
    const cpfParam = onlyDigits(request.nextUrl.searchParams.get("cpf"));

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            isGuest: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // Verifica acesso:
    // 1. Usuário autenticado é o dono do pedido
    // 2. Usuário autenticado é admin
    // 3. Pedido pertence a um guest (mostra com dados limitados)
    const isOwner = user && order.userId === user.id;
    const isAdmin = user && user.role === "admin";
    const isGuestOrder = order.user?.isGuest === true;

    const isPublicMatch =
      !user &&
      !isGuestOrder &&
      typeof emailParam === "string" &&
      emailParam.length > 0 &&
      emailParam === (order.user?.email || "").trim().toLowerCase() &&
      cpfParam.length === 11 &&
      cpfParam === (order.user?.cpf || "").replace(/\D/g, "");

    if (!isOwner && !isAdmin && !isGuestOrder && !isPublicMatch) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Retorna o pedido com informação se é guest
    return NextResponse.json({ 
      success: true, 
      order,
      isGuestOrder: (isGuestOrder || isPublicMatch) && !isOwner,
      showLoginPrompt: (isGuestOrder || isPublicMatch) && !user,
    });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedido" },
      { status: 500 }
    );
  }
}
