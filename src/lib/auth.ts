import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

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

export async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyHS256(token, JWT_SECRET);
    return payload as {
      id: number;
      userId?: string;
      name: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getUser();
  return user !== null;
}

export async function verifyAuth(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return null;
    }

    // Parse cookies manually
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const token = cookies["token"];
    if (!token) {
      return null;
    }

    const payload = await verifyHS256(token, JWT_SECRET);
    return payload as {
      id: number;
      userId?: string;
      name: string;
      email: string;
      role?: string;
    };
  } catch {
    return null;
  }
}
