/**
 * Bridges Cloudflare Workers types into this repo's TypeScript setup.
 *
 * We can't put @cloudflare/workers-types in tsconfig "types" wholesale: its
 * global Request/Response/fetch declarations collide with the DOM lib the
 * React side compiles against. And this file must stay a SCRIPT (no top-level
 * imports/exports): ambient `declare module` only works in script files, so
 * all references use inline import() types.
 */

type D1Database = import("@cloudflare/workers-types").D1Database;
type R2Bucket = import("@cloudflare/workers-types").R2Bucket;

/**
 * DOM-flavoured Fetcher: the real one from workers-types returns Cloudflare's
 * own Response/Request types, which collide with the DOM lib this repo
 * compiles against (Headers.getSetCookie and friends). Structurally identical
 * for how ASSETS.fetch is actually used.
 */
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare module "cloudflare:workers" {
  export const env: {
    /** D1 binding, declared in .openai/hosting.json / scripts/patch-wrangler.mjs */
    DB: import("@cloudflare/workers-types").D1Database;
    /** R2 uploads bucket — present only once R2_READY is flipped (live since 2026-08-09) */
    UPLOADS?: import("@cloudflare/workers-types").R2Bucket;
  } & Record<string, unknown>;
}

/** No published types; used by lib/knowledgeStore.ts for geometry helpers only. */
declare module "@napi-rs/canvas/geometry.js";
