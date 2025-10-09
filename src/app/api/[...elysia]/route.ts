import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function handle(req: NextRequest) {
  try {
    const { handler: elysiaHandler } = await import(
      "../../../../server/server"
    );
    return await elysiaHandler(req as any);
  } catch (e: any) {
    const message = e?.message || "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}
export async function PUT(req: NextRequest) {
  return handle(req);
}
export async function DELETE(req: NextRequest) {
  return handle(req);
}
