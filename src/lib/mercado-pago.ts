import { MercadoPagoConfig, Payment } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error(
    "MERCADO_PAGO_ACCESS_TOKEN is not set. Please define it in your environment.",
  );
}

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken,
});

export const mercadoPagoPayment = new Payment(mercadoPagoClient);

export function getWebhookUrl(): string | null {
  const explicit = process.env.MERCADO_PAGO_NOTIFICATION_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";

  if (!baseUrl) {
    return null;
  }

  const sanitized = baseUrl.replace(/\/$/, "");
  const isHttp = /^https?:\/\//i.test(sanitized);
  const isLocal = /localhost|127\.0\.0\.1/i.test(sanitized);

  if (!isHttp || isLocal) {
    return null;
  }

  return `${sanitized}/api/mercado-pago/webhook`;
}
