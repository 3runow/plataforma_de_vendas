import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT
  ? parseInt(process.env.SMTP_PORT, 10)
  : 587;
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD;
const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
  console.warn(
    "SMTP não configurado completamente. Verifique as variáveis de ambiente SMTP_* no .env."
  );
}

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    throw new Error(
      "SMTP não configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD e SMTP_FROM_EMAIL no .env"
    );
  }

  const info = await transporter.sendMail({
    from: `Loja Bricks <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  return info;
}

export function buildOrderConfirmationEmail(params: {
  customerName: string;
  orderId: string | number;
  orderTotal: number;
  paymentMethod: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string | null;
  }[];
}) {
  const { customerName, orderId, orderTotal, paymentMethod, items } = params;

  const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
            ${
              item.imageUrl
                ? `<img src="${item.imageUrl}" alt="${item.name}" width="56" height="56" style="border-radius: 8px; object-fit: cover;" />`
                : ""
            }
            <div>
              <div style="font-weight: 600; color: #0f172a; font-size: 14px;">${
                item.name
              }</div>
              <div style="font-size: 12px; color: #6b7280;">
                Quantidade: ${item.quantity}
              </div>
            </div>
          </td>
          <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #0f172a; font-size: 14px;">
            ${currency.format(item.price * item.quantity)}
          </td>
        </tr>
      `
    )
    .join("");

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Confirmação do Pedido #${orderId}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #020617; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: radial-gradient(circle at top left, #0f172a, #020617 55%); padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #020617; border-radius: 24px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.2); box-shadow: 0 24px 80px rgba(15, 23, 42, 0.9);">
              <!-- Cabeçalho -->
              <tr>
                <td style="padding: 24px 28px 20px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); background: radial-gradient(circle at top left, rgba(248, 250, 252, 0.04), transparent 60%);">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 24px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #e5e7eb;">
                        BRICKS
                      </td>
                      <td style="text-align: right; font-size: 12px; color: #9ca3af;">
                        Pedido <span style="font-weight: 600; color: #e5e7eb;">#${orderId}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Hero -->
              <tr>
                <td style="padding: 32px 28px 8px;">
                  <div style="font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #38bdf8; font-weight: 600; margin-bottom: 8px;">Pedido confirmado</div>
                  <div style="font-size: 24px; line-height: 1.3; font-weight: 800; color: #f9fafb; margin-bottom: 8px;">
                    Valeu, ${customerName.split(" ")[0]}! Seu pedido já está na nossa base.
                  </div>
                  <div style="font-size: 14px; color: #9ca3af; max-width: 480px;">
                    Enviaremos outro e-mail com o código de rastreio assim que o seu pedido for postado. Fique de olho na sua caixa de entrada!
                  </div>
                </td>
              </tr>

              <!-- Resumo -->
              <tr>
                <td style="padding: 8px 28px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 16px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 16px; background-color: #020617; border: 1px solid rgba(148, 163, 184, 0.3);">
                          <tr>
                            <td style="padding: 16px 20px;">
                              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 4px;">Resumo do pedido</div>
                              <div style="font-size: 14px; color: #e5e7eb;">
                                Método de pagamento: <span style="font-weight: 600;">${paymentMethod}</span>
                              </div>
                            </td>
                            <td style="padding: 16px 20px; text-align: right; white-space: nowrap;">
                              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 4px;">Total</div>
                              <div style="font-size: 18px; font-weight: 800; color: #22c55e;">${currency.format(
                                orderTotal
                              )}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Itens -->
                    <tr>
                      <td>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 16px; background-color: #020617; border: 1px solid rgba(30, 64, 175, 0.7);">
                          <tr>
                            <td colspan="2" style="padding: 16px 20px 8px;">
                              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; margin-bottom: 4px;">Produtos Bricks</div>
                              <div style="font-size: 13px; color: #e5e7eb;">Confere aí tudo o que vai chegar na sua casa:</div>
                            </td>
                          </tr>
                          ${itemsHtml || `<tr><td style="padding: 16px 20px; color: #9ca3af; font-size: 14px;">Nenhum item encontrado neste pedido.</td></tr>`}
                        </table>
                      </td>
                    </tr>

                    <!-- Call to action -->
                    <tr>
                      <td style="padding-top: 24px;">
                        <a
                          href="${
                            process.env.NEXT_PUBLIC_APP_URL ||
                            "https://oficialbricks.com.br"
                          }/minha-conta/pedidos/${orderId}"
                          style="display: inline-block; padding: 14px 24px; border-radius: 999px; background-image: linear-gradient(90deg, #22c55e, #22c55e, #22c55e); color: #022c22; font-weight: 700; font-size: 13px; text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.45);"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Acompanhar pedido
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Rodapé -->
              <tr>
                <td style="padding: 20px 28px 24px; border-top: 1px solid rgba(148, 163, 184, 0.2);">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 11px; color: #6b7280;">
                        <div style="font-weight: 600; color: #9ca3af; margin-bottom: 4px;">Equipe Bricks</div>
                        <div>Qualquer dúvida, é só responder este e-mail ou falar com a gente pelo WhatsApp.</div>
                      </td>
                      <td style="text-align: right; font-size: 11px; color: #6b7280;">
                        <div>© ${new Date().getFullYear()} Bricks. Todos os direitos reservados.</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  return html;
}

export function buildContactEmail(params: {
  name: string;
  email: string;
  message: string;
}) {
  const { name, email, message } = params;

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Novo contato pelo site</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #020617; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: radial-gradient(circle at top left, #0f172a, #020617 55%); padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #020617; border-radius: 24px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.2); box-shadow: 0 24px 80px rgba(15, 23, 42, 0.9);">
              <tr>
                <td style="padding: 24px 28px 20px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); background: radial-gradient(circle at top left, rgba(248, 250, 252, 0.04), transparent 60%);">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size: 24px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #e5e7eb;">
                        BRICKS
                      </td>
                      <td style="text-align: right; font-size: 12px; color: #9ca3af;">
                        Novo contato
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 28px;">
                  <div style="font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #38bdf8; font-weight: 600; margin-bottom: 8px;">Mensagem recebida pelo site</div>
                  <div style="font-size: 22px; line-height: 1.3; font-weight: 800; color: #f9fafb; margin-bottom: 12px;">
                    Fala, time Bricks! Chegou um novo contato.
                  </div>
                  <div style="font-size: 14px; color: #9ca3af; margin-bottom: 24px;">
                    Responda o cliente pelo e-mail abaixo assim que possível.
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 16px; background-color: #020617; border: 1px solid rgba(148, 163, 184, 0.3); margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 4px;">Dados do cliente</div>
                        <div style="font-size: 14px; color: #e5e7eb; font-weight: 600;">${
                          name || "Não informado"
                        }</div>
                        <div style="font-size: 13px; color: #93c5fd;">${
                          email || "Sem e-mail"
                        }</div>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="border-radius: 16px; background-color: #020617; border: 1px solid rgba(30, 64, 175, 0.7);">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #93c5fd; margin-bottom: 6px;">Mensagem</div>
                        <div style="font-size: 14px; color: #e5e7eb; white-space: pre-line;">${message}</div>
                      </td>
                    </tr>
                  </table>

                  <div style="font-size: 11px; color: #6b7280; margin-top: 20px;">
                    Este e-mail foi gerado automaticamente pelo formulário de contato do site.
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 16px 28px 20px; border-top: 1px solid rgba(148, 163, 184, 0.2); font-size: 11px; color: #6b7280; text-align: right;">
                  © ${new Date().getFullYear()} Bricks.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  return html;
}
