import { setting } from "@/lib/settings";

// Signing links (2026-10-27): a client signs their agreement on a public page,
// before they get their portal link. The link is /sign/<client id>/<sig>, where
// sig is an HMAC of the client id, so it can't be guessed and needs no new
// table. Keyed by an existing Worker secret; with none set, links are off.

function secret(): string | undefined {
  return setting("SIGN_LINK_SECRET") ?? setting("PORTAL_HOOK_SECRET") ?? setting("ADMIN_ACCESS_TOKEN");
}

async function hmac(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`sign:${msg}`)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").slice(0, 24);
}

export async function signatureFor(clientId: string): Promise<string | null> {
  const key = secret();
  return key ? hmac(key, clientId) : null;
}

export async function signPath(clientId: string): Promise<string | null> {
  const sig = await signatureFor(clientId);
  return sig ? `/sign/${clientId}/${sig}` : null;
}

/** Constant-time check of a signing link's sig. */
export async function verifySignLink(clientId: string, sig: string): Promise<boolean> {
  const want = await signatureFor(clientId);
  if (!want || want.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
