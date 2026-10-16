import { env } from "cloudflare:workers";

/** A Worker setting: the binding/var/secret on Cloudflare, else process.env
    (local dev). Empty strings count as unset. */
export function setting(name: string): string | undefined {
  const fromEnv = (env as Record<string, unknown>)[name];
  return (typeof fromEnv === "string" && fromEnv) || process.env[name] || undefined;
}
