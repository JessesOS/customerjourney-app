/**
 * What changes for a client moved from one client type to another (for
 * example Fin, from bss-meta to a custom BSS product): portalJourneyFor(old)
 * against portalJourneyFor(new). Ticks are stored by step id, so a step id
 * both journeys show keeps its tick.
 *
 *   npm run products:check -- --compare <old client type> <new client type>
 *
 * Read-only: it prints, it never moves anyone. Moving a client is a prod data
 * change with Jesse's OK and its own deploy package (docs/products/README.md §9).
 */
import type { MilestoneTemplate, PortalJourney } from "../../lib/journeyTypes";
import type { Registry } from "../../lib/productRegistry";

const short = (value: unknown): string => {
  if (value === undefined || value === null) return "not set";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const flat = text.replace(/\s+/g, " ").trim();
  const cut = flat.length > 90 ? `${flat.slice(0, 87)}…` : flat;
  return typeof value === "string" ? `"${cut}"` : cut;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Two different values, short. Long texts that only differ late are shown from just before the first difference. */
function change(a: unknown, b: unknown): string {
  if (typeof a !== "string" || typeof b !== "string") return `${short(a)} → ${short(b)}`;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (i <= 50) return `${short(a)} → ${short(b)}`;
  const from = i - 30;
  const part = (text: string) => short(`…${text.slice(from)}`);
  return `${part(a)} → ${part(b)}`;
}

type Placed = { stage: string; step: MilestoneTemplate };

function placed(journey: PortalJourney): Map<string, Placed> {
  return new Map(journey.stages.flatMap((s) => s.milestones.map((m) => [m.id, { stage: s.id, step: m }] as const)));
}

/** The differences, one line each (sub-items indented). Throws for a client type no product defines. */
export function compareJourneys(reg: Registry, from: string, to: string): string[] {
  for (const ct of [from, to]) if (!reg.isClientType(ct)) throw new Error(`"${ct}" is not a client type any product defines`);
  const a = reg.portalJourneyFor(from);
  const b = reg.portalJourneyFor(to);
  const L: string[] = [`Moving a client from ${from} (${reg.adminLabelFor(from)}) to ${to} (${reg.adminLabelFor(to)}): what their portal would show.`];
  let differences = 0;
  const line = (text: string) => { L.push(`  ${text}`); differences++; };
  const field = (label: string, x: unknown, y: unknown) => { if (!same(x, y)) line(`${label}: ${change(x, y)}`); };

  // The journey as a whole.
  field("Days to go-live", a.totalDays, b.totalDays);
  field("Name the client sees", a.brandName ?? a.wordmark, b.brandName ?? b.wordmark);
  field("Tagline", a.tagline, b.tagline);
  field("Look (locked)", a.lockedLook, b.lockedLook);
  field("Intro video", a.introVideo?.src, b.introVideo?.src);
  if (a.hidesIncentive !== b.hidesIncentive) line(`$200 "move fast" popup: ${a.hidesIncentive ? "hidden" : "shown"} → ${b.hidesIncentive ? "hidden" : "shown"}`);
  const stageIds = [...new Set([...a.stages.map((s) => s.id), ...b.stages.map((s) => s.id)])];
  for (const id of stageIds) {
    const x = a.stages.find((s) => s.id === id);
    const y = b.stages.find((s) => s.id === id);
    if (!x || !y) { line(`Stage ${id}: ${x ? "shown" : "none"} → ${y ? "shown" : "none"}`); continue; }
    for (const key of ["name", "dayStart", "dayEnd", "ongoing", "blurb", "statusNotes"] as const) field(`Stage ${id} ${key}`, x[key], y[key]);
  }

  // Steps: kept (ticks carry over), no longer shown, new, moved, changed.
  const pa = placed(a);
  const pb = placed(b);
  const kept = [...pa.keys()].filter((id) => pb.has(id));
  const gone = [...pa.keys()].filter((id) => !pb.has(id));
  const added = [...pb.keys()].filter((id) => !pa.has(id));
  L.push(`  Steps kept: ${kept.length} of ${pa.size} (their ticks carry over)`);
  if (gone.length) {
    line(`Steps the client would no longer see (${gone.length}; a tick on one stays stored but no longer counts):`);
    for (const id of gone) L.push(`    - ${id} ${short(pa.get(id)!.step.title)}`);
  }
  if (added.length) {
    line(`New steps (${added.length}; open until the client does them):`);
    for (const id of added) L.push(`    - ${id} ${short(pb.get(id)!.step.title)} (${pb.get(id)!.stage})`);
  }
  for (const id of kept) {
    const x = pa.get(id)!;
    const y = pb.get(id)!;
    if (x.stage !== y.stage) line(`${id} moves stage: ${x.stage} → ${y.stage}`);
    const keys = [...new Set([...Object.keys(x.step), ...Object.keys(y.step)])] as (keyof MilestoneTemplate)[];
    for (const key of keys) field(`${id} ${key}`, x.step[key], y.step[key]);
  }

  // Per-step tweaks and features, for the steps both show.
  for (const id of kept) {
    field(`${id} note`, a.taskNotes[id], b.taskNotes[id]);
    const shown = (j: PortalJourney, list: keyof Pick<PortalJourney, "hiddenTaskVideos" | "hiddenTaskBooking" | "hiddenTaskImportant">) => !j[list].includes(id);
    for (const [list, label] of [["hiddenTaskVideos", "video"], ["hiddenTaskBooking", "booking calendar"], ["hiddenTaskImportant", "\"Important\" box"]] as const) {
      if (shown(a, list) !== shown(b, list)) line(`${id} ${label}: ${shown(a, list) ? "shown" : "hidden"} → ${shown(b, list) ? "shown" : "hidden"}`);
    }
    for (const [list, label] of [["playgroundSteps", "live AI receptionist test"], ["landingPreviewSteps", "landing-page preview"]] as const) {
      if (a[list].includes(id) !== b[list].includes(id)) line(`${id} ${label}: ${a[list].includes(id) ? "on" : "off"} → ${b[list].includes(id) ? "on" : "off"}`);
    }
  }

  // Voice guide, Ask-AI, String Theory.
  for (const id of stageIds) {
    const x = a.stageGuides[id];
    const y = b.stageGuides[id];
    if (!x !== !y) line(`Voice guide on ${id}: ${x ? "on" : "off"} → ${y ? "on" : "off"}`);
    else if (x && y) { field(`Voice guide script on ${id}`, x.script, y.script); field(`Voice guide audio on ${id}`, x.audioSrc, y.audioSrc); }
    if (!same(a.askItems[id] ?? [], b.askItems[id] ?? [])) line(`Ask-AI on ${id}: ${(a.askItems[id] ?? []).length} → ${(b.askItems[id] ?? []).length} questions (wording differs)`);
  }
  if (!a.stringPlan !== !b.stringPlan) line(`String Theory: ${a.stringPlan ? "on" : "off"} → ${b.stringPlan ? "on" : "off"}`);
  else if (a.stringPlan && b.stringPlan && !same(a.stringPlan, b.stringPlan)) {
    line(`String Theory changes: go-live day ${a.stringPlan.goLiveDay} → ${b.stringPlan.goLiveDay}; strands ${a.stringPlan.workstreams.map((w) => w.id).join(", ")} → ${b.stringPlan.workstreams.map((w) => w.id).join(", ")}`);
  }

  if (!differences) L.push("  No differences: the client would see the same portal.");
  return L;
}
