import { env } from "cloudflare:workers";
import { mediaAllowlist } from "@/lib/productRegistry";

// Large portal media (videos too big for static assets, 25 MiB cap) served
// from the R2 bucket under media/, with Range support so the player can seek
// and start before the whole file arrives. Only names on this list are served:
// every product variant's /api/media/ intro video (e.g. bss-meta's
// bss-launch-walkthrough.mp4, Jesse's BSS Launchpad walkthrough, 2026-10-16).
// A new video still has to be uploaded to the R2 bucket (prod and staging).
const MEDIA: Record<string, { key: string; type: string }> = mediaAllowlist();

type R2Range = { offset: number; length?: number } | { suffix: number };
type R2Obj = { size: number; body: ReadableStream; httpEtag?: string; range?: { offset?: number; length?: number } };
type R2Like = {
  head(key: string): Promise<{ size: number; httpEtag?: string } | null>;
  get(key: string, options?: { range?: R2Range }): Promise<R2Obj | null>;
};

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const entry = MEDIA[name];
  const bucket = (env as Record<string, unknown>).UPLOADS as R2Like | undefined;
  if (!entry || !bucket) return new Response("Not found", { status: 404 });

  const head = await bucket.head(entry.key);
  if (!head) return new Response("Not found", { status: 404 });
  const size = head.size;
  const base = {
    "Content-Type": entry.type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
    ...(head.httpEtag ? { ETag: head.httpEtag } : {}),
  };

  const range = request.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (m && (m[1] || m[2])) {
    let start: number, end: number;
    if (m[1]) {
      start = Number(m[1]);
      end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    } else {
      const suffix = Math.min(Number(m[2]), size);
      start = size - suffix;
      end = size - 1;
    }
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    }
    const obj = await bucket.get(entry.key, { range: { offset: start, length: end - start + 1 } });
    if (!obj) return new Response("Not found", { status: 404 });
    return new Response(obj.body, {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const obj = await bucket.get(entry.key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, { status: 200, headers: { ...base, "Content-Length": String(size) } });
}
