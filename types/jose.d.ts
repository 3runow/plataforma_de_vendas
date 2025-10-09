declare module "jose" {
  export function jwtVerify(
    token: string,
    key: Uint8Array | CryptoKey | string
  ): Promise<{ payload: Record<string, any> }>;
}
