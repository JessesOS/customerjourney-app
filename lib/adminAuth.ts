export function isAdminEmail(email: string | null) {
  if (!email) return false;

  const configured = process.env.LIVE_DASHBOARD_ADMIN_EMAIL?.toLowerCase();
  if (configured) {
    return email.toLowerCase() === configured;
  }

  return email.toLowerCase() === "jessallan@gmail.com";
}

export function isLocalDevelopmentHost(host: string | null) {
  return Boolean(host && /localhost|127\.0\.0\.1/.test(host));
}

/** Fallback admin check for deploys without the ChatGPT-injected auth header (e.g. a raw Cloudflare Workers URL). */
export function isAdminToken(token: string | null) {
  const configured = process.env.ADMIN_ACCESS_TOKEN;
  return Boolean(configured && token && token === configured);
}
