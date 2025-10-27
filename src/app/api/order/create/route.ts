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

    // Verifica se já existe um endereço idêntico para evitar duplicatas
    let addressId = address.id;
    if (!addressId) {
      if (!address.recipientName) {
        return NextResponse.json(
          { error: "recipientName é obrigatório para criar endereço" },
          { status: 400 }
        );
      }

      // Verifica se já existe um endereço idêntico
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId: user.id,
          recipientName: address.recipientName,
          street: address.street,
          number: address.number,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          cep: address.cep,
        },
      });

      if (existingAddress) {
        console.log(
          "Endereço já existe, usando o existente:",
          existingAddress.id
        );
        addressId = existingAddress.id;
      } else {
        console.log("Criando novo endereço");
        const addressCreated = await prisma.address.create({
          data: {
            name: address.name || null,
            recipientName: address.recipientName,
            cep: address.cep,
            street: address.street,
            number: address.number,
            complement: address.complement || null,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            userId: user.id,
          },
        });
        addressId = addressCreated.id;
      }
    }

    // Verifica se há estoque suficiente (mas não reduz ainda)
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produto com ID ${item.productId} não encontrado` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para o produto ${product.name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
          },
          { status: 400 }
        );
      }
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
          create: items.map(
            (item: { productId: number; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              // price removido - campo não existe no banco ainda
            })
          ),
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

    console.log("Pedido criado:", {
      id: order.id,
      userId: order.userId,
      status: order.status,
      total: order.total,
      itemsCount: order.items.length,
      items: order.items.map(
        (item: {
          productId: number;
          product: { name: string; price: number };
          quantity: number;
        }) => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price, // Preço do produto (não do OrderItem)
        })
      ),
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
