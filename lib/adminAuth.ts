const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** True only for the local dev server: an exact hostname match, so a name like
    "localhost.evil.com" doesn't count (2026-10-16). */
export function isLocalDevelopmentHost(hostname: string | null) {
  return Boolean(hostname && LOCAL_HOSTNAMES.has(hostname.toLowerCase()));
}

/** Fallback admin check for deploys without the ChatGPT-injected auth header (e.g. a raw Cloudflare Workers URL). */
export function isAdminToken(token: string | null) {
  const configured = process.env.ADMIN_ACCESS_TOKEN;
  return Boolean(configured && token && token === configured);
}

/**
 * Shared gate for admin API routes: a local dev host, or ADMIN_ACCESS_TOKEN
 * (x-admin-token header or ?token= query). Routes that must not accept the
 * shared token pass { allowToken: false }.
 *
 * It no longer trusts the "oai-authenticated-user-email" header (2026-10-16).
 * Codex Sites set that header itself; on Cloudflare any caller can send it, so
 * anyone who sent Jesse's email got admin on the live worker.
 */
export function requestCanAdmin(request: Request, { allowToken = true }: { allowToken?: boolean } = {}) {
  if (isLocalDevelopmentHost(new URL(request.url).hostname)) return true;

  if (!allowToken) return false;

  const token = new URL(request.url).searchParams.get("token") ?? request.headers.get("x-admin-token");
  if (isAdminToken(token)) return true;

  return false;
}
