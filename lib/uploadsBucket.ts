import { env } from "cloudflare:workers";

/**
 * Optional R2 bucket for client file uploads. Declared as `UPLOADS` in
 * .openai/hosting.json (local dev gets a miniflare-emulated bucket
 * automatically). In production the binding exists only once R2 is enabled on
 * the account and R2_READY is flipped in scripts/patch-wrangler.mjs — until
 * then this returns null and uploads stay inline in D1, the pre-R2 behavior.
 */
type R2ObjectBodyLike = { text(): Promise<string> };

export type UploadsBucket = {
  put(key: string, value: string): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options: { prefix: string }): Promise<{ objects: { key: string }[] }>;
};

export function getUploadsBucket(): UploadsBucket | null {
  return ((env as Record<string, unknown>).UPLOADS as UploadsBucket | undefined) ?? null;
}

export function uploadObjectKey(clientId: string, milestoneId: string): string {
  return `uploads/${clientId}/${milestoneId}`;
}
