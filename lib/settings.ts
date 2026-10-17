import { env } from "cloudflare:workers";

/** A Worker setting: the binding/var/secret on Cloudflare, else process.env
    (local dev). Empty strings count as unset. */
export function setting(name: string): string | undefined {
  const fromEnv = (env as Record<string, unknown>)[name];
  return (typeof fromEnv === "string" && fromEnv) || process.env[name] || undefined;
}

/** Draft products (products/<id> with status "draft") are offered in admin and
    their boards start only where PRODUCT_DRAFTS=1: staging, or locally via
    .dev.vars. Prod leaves it unset, so a draft never reaches a real client. */
export function productDraftsEnabled(): boolean {
  return setting("PRODUCT_DRAFTS") === "1";
}
