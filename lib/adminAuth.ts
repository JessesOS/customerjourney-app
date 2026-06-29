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
