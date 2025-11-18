import { NextResponse } from "next/server";
import { sendEmail, buildContactEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body as {
      name?: string;
      email?: string;
      message?: string;
    };

    if (!email || !message) {
      return NextResponse.json(
        { error: "E-mail e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const html = buildContactEmail({
      name: name || "Não informado",
      email,
      message,
    });

    await sendEmail({
      // Sempre envia o contato para o e-mail oficial da loja
      to: "contato@oficialbricks.com.br",
      subject: "Novo contato pelo site - Bricks",
      html,
      text: `Nome: ${name || "Não informado"}\nE-mail: ${email}\n\nMensagem:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar contato:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}
