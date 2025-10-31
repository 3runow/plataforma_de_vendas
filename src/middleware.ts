import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado nas variáveis de ambiente. Configure a variável JWT_SECRET no arquivo .env");
}

// Garantir ao TypeScript que JWT_SECRET é string (já foi verificado acima)
const JWT_SECRET_KEY: string = JWT_SECRET;

function base64UrlToBase64(input: string) {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return b64;
}

function base64ToUint8Array(b64: string) {
  const binary =
    typeof atob === "function"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyHS256(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [headerB64, payloadB64, sigB64] = parts;
  const data = `${headerB64}.${payloadB64}`;

  const sig = base64ToUint8Array(base64UrlToBase64(sigB64));

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const enc = new TextEncoder().encode(data);
  const valid = await crypto.subtle.verify("HMAC", key, sig, enc);
  if (!valid) throw new Error("Invalid signature");

  const payloadJson = new TextDecoder().decode(
    base64ToUint8Array(base64UrlToBase64(payloadB64))
  );
  return JSON.parse(payloadJson);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Protege a rota de checkout - requer autenticação
  if (pathname.startsWith("/checkout")) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("login", "true");
      return NextResponse.redirect(url);
    }

    try {
      await verifyHS256(token, JWT_SECRET_KEY);
      return NextResponse.next();
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("login", "true");
      return NextResponse.redirect(url);
    }
  }

  // Protege a rota de dashboard - requer autenticação e role admin
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    try {
      const payload = await verifyHS256(token, JWT_SECRET_KEY);

      interface JWTPayload {
        role?: string;
      }

      if ((payload as JWTPayload).role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    } catch {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkout/:path*"],
};
