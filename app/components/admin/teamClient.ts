"use client";

import { useCallback, useEffect, useState } from "react";

/** The admin access code saved in this browser (also used by the Clients page). */
export const ADMIN_TOKEN_KEY = "scaleAdminToken";

function savedToken(): string | null {
  try { return window.localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

/**
 * fetch for the back office. Sends the saved access code when there is one;
 * on a Cloudflare Access address the browser's sign-in cookie does the work.
 */
export async function teamFetch<T = Record<string, unknown>>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<{ status: number; data: T & { ok?: boolean; error?: string } }> {
  const token = savedToken();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
  if (token) headers["x-admin-token"] = token;
  if (init.json !== undefined) headers["content-type"] = "application/json";
  const res = await fetch(path, { ...init, headers, body: init.json !== undefined ? JSON.stringify(init.json) : init.body, cache: "no-store" });
  let data = {} as T & { ok?: boolean; error?: string };
  try { data = (await res.json()) as typeof data; } catch {}
  return { status: res.status, data };
}

export type Me = { email: string; name: string; isAdmin: boolean; roles: string[]; via: "access" | "local" | "code"; portalBase: string };

/** Who is signed in. `state` is "off" when the team board isn't switched on here. */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "locked" | "off">("loading");
  const load = useCallback(async () => {
    const { status, data } = await teamFetch<Me>("/api/admin/me");
    if (status === 200 && data.ok) { setMe(data); setState("ok"); }
    else if (status === 404) setState("off");
    else setState("locked");
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { me, state, reload: load };
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export const STATUS_LABEL: Record<string, string> = { queued: "To do", in_progress: "In progress", complete: "Done" };
export const PRIORITY_CHIP: Record<string, string> = { critical: "tb-chip tb-chip--red", high: "tb-chip tb-chip--gold", normal: "tb-chip", low: "tb-chip" };
