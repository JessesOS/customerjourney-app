/**
 * Proof that the team back office's sign-in can't be faked (Option D, Phase 2).
 *
 * Generates an RSA key pair, signs Cloudflare Access-style tokens with it, and
 * checks lib/accessJwt.ts accepts only a correctly signed, unexpired token for
 * the right team and audience. Also re-checks the admin gate in lib/adminAuth.ts.
 *
 *   npm run check:team-auth
 */
import { setAccessKeysForTest, verifyAccessToken, type Jwk } from "../lib/accessJwt";
import { requestCanAdmin } from "../lib/adminAuth";

const DOMAIN = "allconvos.cloudflareaccess.com";
const AUD = "aud-tag-staging";

function b64url(bytes: Uint8Array | string): string {
  const s = typeof bytes === "string" ? bytes : String.fromCharCode(...bytes);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function keyPair(kid: string) {
  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as Jwk;
  return { privateKey: pair.privateKey, jwk: { ...jwk, kid, alg: "RS256", use: "sig" } };
}

async function sign(privateKey: CryptoKey, kid: string, payload: Record<string, unknown>, alg = "RS256") {
  const head = b64url(JSON.stringify({ alg, kid, typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

const nowS = Math.floor(Date.now() / 1000);
const good = { aud: [AUD], iss: `https://${DOMAIN}`, exp: nowS + 3600, iat: nowS, email: "Jesse@Example.com" };

let failed = 0;
function expect(name: string, got: unknown, want: unknown) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: ${JSON.stringify(got)}`);
}

const team = await keyPair("k1");
const stranger = await keyPair("k1"); // same kid, different key: a forger
setAccessKeysForTest([team.jwk]);

expect("valid token → email (lowercased)", await verifyAccessToken(await sign(team.privateKey, "k1", good), DOMAIN, [AUD]), "jesse@example.com");
expect("valid token, one of several audiences", await verifyAccessToken(await sign(team.privateKey, "k1", good), DOMAIN, ["other", AUD]), "jesse@example.com");
expect("wrong audience", await verifyAccessToken(await sign(team.privateKey, "k1", { ...good, aud: ["prod-aud"] }), DOMAIN, [AUD]), null);
expect("wrong issuer", await verifyAccessToken(await sign(team.privateKey, "k1", { ...good, iss: "https://evil.cloudflareaccess.com" }), DOMAIN, [AUD]), null);
expect("expired", await verifyAccessToken(await sign(team.privateKey, "k1", { ...good, exp: nowS - 5 }), DOMAIN, [AUD]), null);
expect("not yet valid", await verifyAccessToken(await sign(team.privateKey, "k1", { ...good, nbf: nowS + 3600 }), DOMAIN, [AUD]), null);
expect("signed by someone else", await verifyAccessToken(await sign(stranger.privateKey, "k1", good), DOMAIN, [AUD]), null);
expect("unknown key id", await verifyAccessToken(await sign(team.privateKey, "k9", good), DOMAIN, [AUD]), null);
expect("alg none / not RS256", await verifyAccessToken(await sign(team.privateKey, "k1", good, "none"), DOMAIN, [AUD]), null);
expect("no email", await verifyAccessToken(await sign(team.privateKey, "k1", { ...good, email: undefined }), DOMAIN, [AUD]), null);
const real = await sign(team.privateKey, "k1", good);
const [h, , s] = real.split(".");
expect("payload edited after signing", await verifyAccessToken(`${h}.${b64url(JSON.stringify({ ...good, email: "attacker@evil.com" }))}.${s}`, DOMAIN, [AUD]), null);
expect("garbage", await verifyAccessToken("not.a.token", DOMAIN, [AUD]), null);
expect("no token", await verifyAccessToken(null, DOMAIN, [AUD]), null);
expect("Access not configured (no domain)", await verifyAccessToken(real, undefined, [AUD]), null);
expect("Access not configured (no audience)", await verifyAccessToken(real, DOMAIN, []), null);

// The admin gate: identity headers never count, localhost is an exact match.
process.env.ADMIN_ACCESS_TOKEN = "code-123";
const live = "https://scale-onboarding-portal.jesse-b4e.workers.dev/api/admin/team/overview";
const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });
expect("admin: forged Access email header", requestCanAdmin(req(live, { "cf-access-authenticated-user-email": "jesse@example.com" })), false);
expect("admin: localhost.evil.com", requestCanAdmin(req("https://localhost.evil.com/api/admin/x")), false);
expect("admin: access code", requestCanAdmin(req(live, { "x-admin-token": "code-123" })), true);
expect("admin: localhost", requestCanAdmin(req("http://localhost:3333/api/admin/x")), true);

setAccessKeysForTest(null);
console.log(failed ? `\nFAIL ${failed} check(s)` : "\nPASS check:team-auth");
process.exit(failed ? 1 : 0);
