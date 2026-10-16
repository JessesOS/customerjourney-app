/**
 * Proof that Fin's live portal (product "bss-meta") hasn't changed.
 *
 * Captures everything his portal is built from, from code only (no client
 * data): the Scale journey template, the stages it builds for bss-meta across
 * many completion sets and days, every bss-meta product-map entry, its voice
 * guides, Ask-AI answers and String Theory plan. Compares it with the saved
 * fixture.
 *
 *   npm run check:fin            check (exit 1 on any difference)
 *   npm run check:fin -- --write  re-save the fixture (only for a change Jesse approved)
 *
 * Added 2026-10-16 for the Option D build (plan: ~/.claude/plans/temporal-waddling-wave.md).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildJourneyStages,
  defaultCompletedMilestoneIds,
  journeyTemplate,
  journeyTotalDays,
  milestoneVisibleFor,
} from "../lib/onboardingJourney";
import * as engine from "../lib/journeyEngine";
import { stageGuideFor } from "../lib/stageGuide";
import { askItemsFor } from "../lib/askAi";
import { scaleMetaStringPlan } from "../lib/stringPlans";

const CLIENT_TYPE = "bss-meta" as const;
const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "fin-bss-meta-journey.json");

/** Stable JSON: object keys sorted, so key order never causes a false diff. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

export function finSnapshot() {
  // Steps Fin can see, in the order his portal shows them.
  const visibleIds = journeyTemplate.flatMap((s) => s.milestones.filter((m) => milestoneVisibleFor(m, CLIENT_TYPE)).map((m) => m.id));
  const completionSets: Record<string, string[]> = {
    none: [],
    all: visibleIds,
    defaults: defaultCompletedMilestoneIds,
  };
  visibleIds.forEach((_, i) => { completionSets[`first-${i + 1}`] = visibleIds.slice(0, i + 1); });

  const renders: Record<string, unknown> = {};
  for (const [name, ids] of Object.entries(completionSets)) {
    for (const day of [1, 12, 30]) {
      renders[`${name}@day${day}`] = buildJourneyStages(new Set(ids), day, CLIENT_TYPE);
    }
  }

  const productMaps = Object.fromEntries(
    Object.entries(engine)
      .filter(([name, v]) => (name.startsWith("product") || name === "clientTypeLabels") && v && typeof v === "object")
      .map(([name, v]) => [name, (v as Record<string, unknown>)[CLIENT_TYPE] ?? null]),
  );

  const stageIds = journeyTemplate.map((s) => s.id);
  return canonical({
    clientType: CLIENT_TYPE,
    journeyTotalDays,
    journeyTemplate,
    visibleIds,
    renders,
    productMaps,
    stageGuides: Object.fromEntries(stageIds.map((id) => [id, stageGuideFor(CLIENT_TYPE, id) ?? null])),
    askItems: Object.fromEntries(stageIds.map((id) => [id, askItemsFor(CLIENT_TYPE, id)])),
    stringPlan: scaleMetaStringPlan,
  });
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const current = JSON.stringify(finSnapshot(), null, 2) + "\n";
  if (process.argv.includes("--write")) {
    writeFileSync(FIXTURE, current);
    console.log(`Saved Fin's journey baseline → ${FIXTURE}`);
  } else {
    let saved: string;
    try {
      saved = readFileSync(FIXTURE, "utf8");
    } catch {
      console.error(`No baseline at ${FIXTURE}. Run with --write first.`);
      process.exit(1);
    }
    if (saved === current) {
      console.log("PASS Fin's portal (bss-meta) matches the saved baseline.");
    } else {
      const a = saved.split("\n"), b = current.split("\n");
      const at = a.findIndex((line, i) => line !== b[i]);
      console.error(`FAIL Fin's portal (bss-meta) differs from the baseline, first at line ${at + 1}:`);
      console.error(`  saved:   ${a[at]}`);
      console.error(`  current: ${b[at]}`);
      process.exit(1);
    }
  }
}
