import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // por segurança, sempre retornamos sucesso mesmo se o email não existir
    // isso ai evita que os malandros descubram quais emails estão cadastrados
    if (!user) {
      return NextResponse.json({
        message: "Se o email existir, você receberá instruções de recuperação.",
      });
    }

    // gera token de recuperação
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // salva token no banco de dados
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // URL de reset (ajuste conforme o domínio deles)
    const resetUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // enviar email via resend
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email,
      subject: "Recuperação de Senha",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
              }
              h1 {
                color: #2563eb;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
              }
              .button:hover {
                background-color: #1d4ed8;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
              }
              .warning {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Recuperação de Senha</h1>
              <p>Olá,</p>
              <p>Você solicitou a recuperação de senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
              
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 1 hora.
              </div>
              
              <p>Se você não solicitou esta recuperação, pode ignorar este email com segurança.</p>
              
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
              
              <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      message: "Se o email existir, você receberá instruções de recuperação.",
    });
  } catch (error) {
    console.error("Erro ao processar recuperação de senha:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
