import { env } from "cloudflare:workers";

// BSS journey sync with the CSM dashboard (contract: csm-dashboard
// docs/journey-sync.md, approved by Jesse 2026-10-15). Both apps use the same
// task ids, bss-001 … bss-041. This side:
//   - receives the team's changes at /api/csm-sync/milestone (never echoes back)
//   - pushes changes made here (Fin's completions, the admin checklist) to CSM.
// Shared secret JOURNEY_SYNC_TOKEN on both workers, header x-journey-sync-token.
// No token configured: the endpoint refuses and nothing is pushed.

const DEFAULT_CSM_URL = "https://csm-dashboard.jesse-b4e.workers.dev";
const PUSH_TIMEOUT_MS = 3000;

function setting(name: string): string | undefined {
  const fromEnv = (env as Record<string, unknown>)[name];
  return (typeof fromEnv === "string" && fromEnv) || process.env[name] || undefined;
}

export function journeySyncToken(): string | undefined {
  return setting("JOURNEY_SYNC_TOKEN");
}

export function isBssMilestoneId(id: string): boolean {
  return /^bss-\d{3}$/.test(id);
}

/** True when the request carries the shared token (header or Bearer). */
export function requestHasSyncToken(request: Request): boolean {
  const token = journeySyncToken();
  if (!token) return false;
  const header = request.headers.get("x-journey-sync-token");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === token || bearer === token;
}

/**
 * Tell the CSM dashboard a BSS task was completed or un-completed here.
 * Never throws and never takes longer than a few seconds, so a client's
 * completion can't fail because the CSM is down.
 */
export async function pushMilestoneToCsm(input: { journeyClientId: string; milestoneId: string; done: boolean; note?: string }): Promise<void> {
  const token = journeySyncToken();
  if (!token || !isBssMilestoneId(input.milestoneId)) return;
  const base = (setting("CSM_SYNC_URL") ?? DEFAULT_CSM_URL).replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUSH_TIMEOUT_MS);
  try {
    const body: Record<string, unknown> = { journeyClientId: input.journeyClientId, milestoneId: input.milestoneId, done: input.done };
    if (input.note && input.note.trim()) body.note = input.note.slice(0, 12000);
    await fetch(`${base}/api/journey-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-journey-sync-token": token },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    // The CSM being down or slow must never affect the portal.
  } finally {
    clearTimeout(timer);
  }
}
