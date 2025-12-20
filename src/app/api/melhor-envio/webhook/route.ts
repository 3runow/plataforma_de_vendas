import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WEBHOOK_TOKEN = process.env.MELHOR_ENVIO_WEBHOOK_TOKEN;

type MelhorEnvioPayload = {
  id?: string | number;
  resource_id?: string | number;
  shipment_id?: string | number;
  tracking?: string;
  tracking_code?: string;
  event?: string;
  type?: string;
  name?: string;
  status?: string;
  description?: string;
  message?: string;
  occurred_at?: string;
  created_at?: string;
  protocol?: string;
  label?: { url?: string } | null;
  data?: {
    id?: string | number;
    status?: string;
    tracking?: string;
    tracking_code?: string;
    protocol?: string;
    description?: string;
    message?: string;
    occurred_at?: string;
    created_at?: string;
    label?: { url?: string } | null;
    location?: { city?: string; state?: string; country?: string } | null;
  } | null;
};

function extractField<T = string>(
  payload: MelhorEnvioPayload,
  ...paths: Array<Array<string>>
): T | undefined {
  for (const path of paths) {
    let current: unknown = payload;
    for (const key of path) {
      if (
        current &&
        typeof current === "object" &&
        key in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined && current !== null && current !== "") {
      return current as T;
    }
  }
  return undefined;
}

function mapOrderStatus(shipmentStatus?: string) {
  switch (shipmentStatus) {
    case "paid":
    case "generated":
    case "ready_for_shipping":
      return "processing";
    case "posted":
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "canceled":
    case "cancelled":
      return "cancelled";
    default:
      return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const tokenHeader = request.headers.get("x-webhook-token");
    const tokenQuery = request.nextUrl.searchParams.get("token");

    if (WEBHOOK_TOKEN && WEBHOOK_TOKEN !== tokenHeader && WEBHOOK_TOKEN !== tokenQuery) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as
      | MelhorEnvioPayload
      | null;

    if (!payload) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const shipmentId = extractField<string | number>(
      payload,
      ["resource_id"],
      ["shipment_id"],
      ["id"],
      ["data", "id"]
    );

    const trackingCode = extractField<string>(
      payload,
      ["tracking_code"],
      ["tracking"],
      ["data", "tracking_code"],
      ["data", "tracking"]
    );

    const protocol = extractField<string>(
      payload,
      ["protocol"],
      ["data", "protocol"]
    );

    const status =
      extractField<string>(payload, ["status"], ["data", "status"]) ||
      payload.event ||
      payload.type ||
      payload.name;

    if (!shipmentId && !trackingCode) {
      return NextResponse.json(
        { error: "Missing shipment identifiers" },
        { status: 400 }
      );
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        OR: [
          shipmentId
            ? { melhorEnvioId: String(shipmentId) }
            : undefined,
          trackingCode
            ? { trackingCode: trackingCode }
            : undefined,
        ].filter(Boolean) as [{ melhorEnvioId: string } | { trackingCode: string }],
      },
      include: { order: true },
    });

    if (!shipment) {
      console.warn("Webhook Melhor Envio sem shipment associado", {
        shipmentId,
        trackingCode,
      });
      return NextResponse.json({ received: true });
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: status || shipment.status,
      trackingCode: trackingCode || shipment.trackingCode,
      protocol: protocol || shipment.protocol,
    };

    const labelUrl = extractField<string>(payload, ["label", "url"], ["data", "label", "url"]);
    if (labelUrl) {
      updateData.labelUrl = labelUrl;
    }

    let orderStatus: string | undefined;

    switch (status) {
      case "paid":
        updateData.paid = true;
        updateData.paidAt = shipment.paidAt ?? now;
        break;
      case "generated":
      case "ready_for_shipping":
        updateData.paid = true;
        updateData.paidAt = shipment.paidAt ?? now;
        break;
      case "posted":
      case "shipped":
        updateData.posted = true;
        updateData.postedAt = shipment.postedAt ?? now;
        orderStatus = "shipped";
        break;
      case "delivered":
        updateData.delivered = true;
        updateData.deliveredAt = shipment.deliveredAt ?? now;
        orderStatus = "delivered";
        break;
      case "canceled":
      case "cancelled":
        updateData.canceled = true;
        updateData.canceledAt = shipment.canceledAt ?? now;
        orderStatus = "cancelled";
        break;
      default:
        orderStatus = mapOrderStatus(status);
        break;
    }

    const description =
      extractField<string>(payload, ["description"], ["message"], ["data", "description"], ["data", "message"]) ||
      status ||
      "Atualização de envio";

    const occurredAt =
      extractField<string>(payload, ["occurred_at"], ["created_at"], ["data", "occurred_at"], ["data", "created_at"]) ||
      now.toISOString();

    const locationParts = [
      extractField<string>(payload, ["data", "location", "city"]),
      extractField<string>(payload, ["data", "location", "state"]),
      extractField<string>(payload, ["data", "location", "country"]),
    ].filter(Boolean);
    const location =
      locationParts.length > 0 ? locationParts.join(" / ") : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: updateData,
      });

      await tx.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: status || "update",
          message: description,
          location,
          date: new Date(occurredAt),
        },
      });

      if (orderStatus) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: {
            status: orderStatus,
            shippingTrackingCode: trackingCode || shipment.trackingCode,
          },
        });
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook do Melhor Envio:", error);
    return NextResponse.json(
      { error: "Falha ao processar webhook" },
      { status: 500 }
    );
  }
}
