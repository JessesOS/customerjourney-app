// Verifying a Cloudflare Access token. Pure (WebCrypto + fetch only, no
// Cloudflare imports) so scripts/check-team-auth.ts can test it directly.

export type Jwk = JsonWebKey & { kid?: string };

let cachedKeys: { domain: string; keys: Jwk[]; at: number } | null = null;
let testKeys: Jwk[] | null = null;

/** For scripts/check-team-auth.ts only: use these keys instead of fetching the team's. */
export function setAccessKeysForTest(keys: Jwk[] | null) {
  testKeys = keys;
  cachedKeys = null;
}

async function accessKeys(domain: string, refresh = false): Promise<Jwk[]> {
  if (testKeys) return testKeys;
  if (!refresh && cachedKeys && cachedKeys.domain === domain && Date.now() - cachedKeys.at < 60 * 60 * 1000) return cachedKeys.keys;
  const res = await fetch(`https://${domain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs: ${res.status}`);
  const body = (await res.json()) as { keys?: Jwk[] };
  cachedKeys = { domain, keys: body.keys ?? [], at: Date.now() };
  return cachedKeys.keys;
}

function b64urlBytes(part: string): Uint8Array<ArrayBuffer> {
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlJson<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(part))) as T;
}

/**
 * The email in a valid Cloudflare Access token, or null. `domain` is the team
 * domain (e.g. allconvos.cloudflareaccess.com); `audiences` are the allowed
 * application audience tags.
 */
export async function verifyAccessToken(token: string | null, domain: string | undefined, audiences: string[]): Promise<string | null> {
  if (!token || !domain || audiences.length === 0) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = b64urlJson<{ alg?: string; kid?: string }>(parts[0]);
    const payload = b64urlJson<{ aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string }>(parts[1]);
    if (header.alg !== "RS256") return null;

    let keys = await accessKeys(domain);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk && !testKeys) {
      keys = await accessKeys(domain, true); // keys rotate: refetch once
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;

    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(parts[2]), signed);
    if (!ok) return null;

    const now = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (!aud.some((a) => audiences.includes(a))) return null;
    if (payload.iss !== `https://${domain}`) return null;
    if (typeof payload.exp !== "number" || payload.exp <= now) return null;
    if (typeof payload.nbf === "number" && payload.nbf > now + 60) return null;
    if (!payload.email) return null;
    return payload.email.toLowerCase();
  } catch {
    return null;
  }
}
