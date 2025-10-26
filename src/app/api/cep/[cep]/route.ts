import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cep: string }> }
) {
  try {
    // Next.js API dynamic routes: acessar context.params.cep diretamente
    const { cep: cepParam } = await context.params;
    const cep = cepParam.replace(/\D/g, "");

    if (cep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
    }

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao conectar ao ViaCEP" },
        { status: 502 }
      );
    }
    const data = await response.json();

    if (data.erro) {
      return NextResponse.json(
        { error: "CEP não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return NextResponse.json({ error: "Erro ao buscar CEP" }, { status: 500 });
  }
}
