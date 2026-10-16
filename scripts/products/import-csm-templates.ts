/**
 * One-off: convert the CSM dashboard's task lists into product team-task files.
 * Kept for provenance, not as a sync. After the first run the product files are
 * edited by hand (ask Claude), so re-running with --write would overwrite those
 * edits.
 *
 *   npx tsx scripts/products/import-csm-templates.ts            dry run: says which outputs would change
 *   npx tsx scripts/products/import-csm-templates.ts --write    write them
 *   ... --csm <path>    the CSM repo (default ~/Master/AI/csm-dashboard)
 *
 * Reads (never writes) csm-dashboard lib/{scaleTasks,respondTasks,bssTasks,types}.ts,
 * frozen at commit 5c9abc9 (Option D, 2026-10-16). Writes:
 *   products/scale/team-tasks.ts, products/respond/team-tasks.ts,
 *   products/bss/team-tasks.ts, products/website/index.ts,
 *   docs/products/conversion-report-2026-10.md
 *
 * Rules (plan: ~/.claude/plans/temporal-waddling-wave.md, Phase 1, plus the CSM
 * session's hand-off notes in docs/option-d-build.md):
 *   - Team side: CSM's title wins. Client steps are not touched here.
 *   - Template notes are kept as each task's guidance.
 *   - Statuses, blocked reasons, portal fields, Loom fields and sortOrder are dropped.
 *   - Scale channels: categories scale-04/scale-05 → meta, scale-06 + scl-309 → google.
 *   - "RT Digital" → "allconvos.ai" in titles and notes; BSS "Intake & Kick-off" → "Intake".
 *   - Every task is placed exactly once: behind a client step, or team-only at stage level.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { respondClientStages } from "../../products/respond/client-steps";
import { scaleClientStages } from "../../products/scale/client-steps";
import type { ProductStage, StageId, TaskPriority, TeamTask } from "../../products/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONVERTED_ON = "2026-10-16";
const CSM_COMMIT = "5c9abc9";
const REPORT_PATH = "docs/products/conversion-report-2026-10.md";

// ── The CSM shapes this script reads (csm-dashboard lib/types.ts) ────────────
type CsmTask = {
  id: string;
  title: string;
  category: string;
  phase: "Onboarding" | "Build" | "Testing" | "Go-Live" | "Post-Launch" | "Support";
  status: string;
  blockedReason?: string;
  assignee: string;
  dueWindow: string;
  priority: TaskPriority;
  dependencies: string[];
  notes: string;
  loomUrl?: string;
  loomTitle?: string;
  portalVisible: boolean;
  portalTitle: string;
  portalNote: string;
  portalActionRequired: boolean;
  portalActionUrl?: string;
  portalActionLabel?: string;
  portalConfigured: boolean;
  sortOrder: number;
};
type CsmCategory = { id: string; name: string; phase: string };
type SourceDoc = { title: string; url: string };

const PHASE_TO_STAGE: Record<CsmTask["phase"], StageId> = {
  Onboarding: "onboarding",
  Build: "build",
  Testing: "testing",
  "Go-Live": "go-live",
  "Post-Launch": "post-launch",
  Support: "support",
};

// ── Step mapping (plan, Phase 1). Client step ← team tasks ─────────────────
const SCALE_STEP_MAP: Record<string, string[]> = {
  "ob-1": ["scl-018", "scl-019a", "scl-048"],
  "ob-2": ["scl-019", "scl-023", "scl-026", "scl-036", "scl-043"],
  "ob-3": ["scl-033", "scl-029"],
  "ob-crm": ["scl-189"],
  "ob-4": ["scl-038"],
  "ob-5": ["scl-039"],
  "ob-6": ["scl-040"], // also completes with ob-6b and ob-6c, see SCALE_COMPLETES_WITH
  "ob-7": ["scl-041"],
  "bd-1": ["scl-060", "scl-049", "scl-055", "scl-062", "scl-072", "scl-077", "scl-082", "scl-087", "scl-089"],
  "bd-2": ["scl-103", "scl-095", "scl-123"],
  "bd-3": ["scl-104", "scl-107"],
  "bd-g1": ["scl-309", "scl-132", "scl-141"],
  "bd-g3": ["scl-149", "scl-144"],
  "bd-g2": ["scl-183", "scl-152", "scl-158", "scl-168", "scl-176", "scl-181"],
  "ts-1": ["scl-218"],
  "ts-2": ["scl-224", "scl-212", "scl-228"],
  "ts-3": ["scl-231"],
  "gl-1": ["scl-240", "scl-232"],
  "gl-2": ["scl-242"],
  "gl-3": ["scl-249"],
  "gl-4": ["scl-258"],
  "gl-5": ["scl-260"],
  "pl-1": ["scl-278"],
  "pl-2": ["scl-279", "scl-280"],
  "pl-3": ["scl-308", "scl-276"],
};
const SCALE_COMPLETES_WITH: Record<string, string[]> = { "scl-040": ["ob-6", "ob-6b", "ob-6c"] };
const SCALE_TEAM_ONLY = [
  "scl-001", "scl-005", "scl-009", "scl-015", "scl-192", "scl-197", "scl-206", "scl-211",
  "scl-264", "scl-271", "scl-282", "scl-286", "scl-292",
  "scl-294", "scl-295", "scl-296", "scl-297", "scl-298", "scl-299", "scl-300",
  "scl-301", "scl-302", "scl-303", "scl-304", "scl-305", "scl-306", "scl-307",
];
/** The plan found no client step for these. Placed team-only at stage level, flagged for Jesse. */
const SCALE_UNPLACED: Record<string, string> = {
  "scl-028": "The portal has no \"send a test message\" step. Could sit behind ob-2 (Welcome Call), or be retired.",
  "scl-047": "Its natural step, ob-8, is hidden (Jesse, 2026-07-12: GBP access no longer needed). Probably retire.",
  "scl-129": "Its natural step, bd-4 (the walkthrough video), is hidden until that flow is reworked. Move behind bd-4 if it comes back.",
  "scl-131": "Same as scl-129: belongs behind bd-4 if it comes back.",
};
const SCALE_CLIENT_ONLY: Record<string, string> = {
  "ob-0": "Voice interview: the client answers, nobody on the team acts on it as a task.",
  "ob-8": "Hidden in the portal (muted 2026-07-12).",
  "bd-4": "Hidden in the portal until the walkthrough flow is reworked.",
};

// Respond: each portal step id is the CSM template id, so a step takes its own
// task plus the ones the plan lists. Everything else is team-only.
const RESPOND_STEP_MAP: Record<string, string[]> = {
  "rsp-012": ["rsp-012", "rsp-016"],
  "rsp-014": ["rsp-014", "rsp-019"],
  "rsp-015": ["rsp-015"],
  "rsp-017": ["rsp-017", "rsp-025"],
  "rsp-018": ["rsp-018"],
  "rsp-048": ["rsp-048", "rsp-041", "rsp-044", "rsp-046"],
  "rsp-049": ["rsp-049"],
  "rsp-059": ["rsp-059", "rsp-050", "rsp-054", "rsp-057", "rsp-058", "rsp-063"],
  "rsp-062": ["rsp-062", "rsp-029", "rsp-030", "rsp-031"],
  "rsp-064": ["rsp-064"],
  "rsp-072": ["rsp-072"],
  "rsp-073": ["rsp-073"],
};
const RESPOND_CLIENT_ONLY: Record<string, string> = {
  "rsp-000": "Voice interview, as Scale's ob-0. No CSM task behind it.",
};

const META_CATEGORY_IDS = ["scale-04-meta-ads-strategy-ebook-creation-gamma-chatgpt-switc", "scale-05-meta-ads-setup-handoff-partner-access"];
const GOOGLE_CATEGORY_IDS = ["scale-06-google-ads-strategy-landing-page-funnel-creation"];
const WEBSITE_TASK_IDS = ["bss-014", "bss-015", "bss-016", "bss-017"];

// ── Helpers ────────────────────────────────────────────────────────────────
type BrandChange = { id: string; field: "title" | "notes"; before: string; after: string };
const brandChanges: BrandChange[] = [];

function rebrand(id: string, field: "title" | "notes", text: string): string {
  if (!text.includes("RT Digital")) return text;
  const after = text.replaceAll("RT Digital", "allconvos.ai");
  for (const line of text.split("\n")) {
    if (line.includes("RT Digital")) brandChanges.push({ id, field, before: line, after: line.replaceAll("RT Digital", "allconvos.ai") });
  }
  return after;
}

function stepIndex(stages: ProductStage[]) {
  const map = new Map<string, { stage: StageId; title: string; hidden: boolean }>();
  for (const stage of stages) for (const step of stage.steps) map.set(step.id, { stage: stage.id, title: step.title, hidden: !!step.hidden });
  return map;
}

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function convert(
  t: CsmTask,
  placement: { step?: string; completesWithSteps?: string[] },
  extra: { category?: string; channels?: ("meta" | "google")[]; dependencies?: string[] } = {},
): TeamTask {
  if (!PHASE_TO_STAGE[t.phase]) fail(`${t.id}: unknown phase ${t.phase}`);
  const task: TeamTask = {
    id: t.id,
    title: rebrand(t.id, "title", t.title),
    notes: rebrand(t.id, "notes", t.notes),
    stage: PHASE_TO_STAGE[t.phase],
    category: extra.category ?? t.category,
    role: t.assignee,
    priority: t.priority,
    due: t.dueWindow,
    dependencies: extra.dependencies ?? [...t.dependencies],
  };
  if (placement.step) task.step = placement.step;
  if (placement.completesWithSteps) task.completesWithSteps = placement.completesWithSteps;
  if (extra.channels) task.channels = extra.channels;
  return task;
}

/** Places every task once using a step map plus an explicit team-only list. */
function place(tasks: CsmTask[], stepMap: Record<string, string[]>, steps: Map<string, unknown>, teamOnly: string[] | "rest") {
  const byTask = new Map<string, string>();
  for (const [step, ids] of Object.entries(stepMap)) {
    if (!steps.has(step)) fail(`step map names unknown client step ${step}`);
    for (const id of ids) {
      if (!tasks.some((t) => t.id === id)) fail(`step map names unknown task ${id}`);
      if (byTask.has(id)) fail(`${id} is mapped twice (${byTask.get(id)} and ${step})`);
      byTask.set(id, step);
    }
  }
  if (teamOnly !== "rest") {
    for (const id of teamOnly) {
      if (!tasks.some((t) => t.id === id)) fail(`team-only list names unknown task ${id}`);
      if (byTask.has(id)) fail(`${id} is both behind ${byTask.get(id)} and team-only`);
    }
  }
  return byTask;
}

// ── Task-file writer ──────────────────────────────────────────────────────
function taskLiteral(task: TeamTask): string {
  const q = (v: unknown) => JSON.stringify(v);
  const lines = [`    id: ${q(task.id)},`, `    title: ${q(task.title)},`, `    stage: ${q(task.stage)},`];
  if (task.step) lines.push(`    step: ${q(task.step)},`);
  if (task.completesWithSteps) lines.push(`    completesWithSteps: [${task.completesWithSteps.map(q).join(", ")}],`);
  lines.push(`    category: ${q(task.category)},`, `    role: ${q(task.role)},`, `    priority: ${q(task.priority)},`, `    due: ${q(task.due)},`);
  if (task.dueDays) lines.push(`    dueDays: { start: ${task.dueDays.start}, end: ${task.dueDays.end} },`);
  lines.push(`    dependencies: [${task.dependencies.map(q).join(", ")}],`);
  if (task.channels) lines.push(`    channels: [${task.channels.map(q).join(", ")}],`);
  lines.push(`    notes: ${q(task.notes)},`);
  return `  {\n${lines.join("\n")}\n  },`;
}

function tasksBody(tasks: TeamTask[]): string {
  const out: string[] = [];
  let category = "";
  for (const task of tasks) {
    if (task.category !== category) {
      category = task.category;
      out.push(`  // ── ${category} (${task.stage}) ──`);
    }
    out.push(taskLiteral(task));
  }
  return out.join("\n");
}

function taskFile(exportName: string, what: string, sourceFile: string, tasks: TeamTask[]): string {
  return `// ${what} team tasks: the work behind the client steps, plus team-only work.
//
// Converted once from csm-dashboard ${sourceFile} at commit ${CSM_COMMIT} on ${CONVERTED_ON}
// by scripts/products/import-csm-templates.ts. Every change made on the way, and
// everything dropped, is in ${REPORT_PATH}.
// From here on this file is edited by hand: ask Claude. Bump the product
// version in index.ts with every change (npm run products:check enforces it).

import type { TeamTask } from "../types";

export const ${exportName}: TeamTask[] = [
${tasksBody(tasks)}
];
`;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const csmRoot = args.includes("--csm") ? resolve(args[args.indexOf("--csm") + 1]) : join(homedir(), "Master", "AI", "csm-dashboard");
  const csmFile = (name: string) => join(csmRoot, "lib", name);
  for (const f of ["scaleTasks.ts", "respondTasks.ts", "bssTasks.ts", "types.ts"]) if (!existsSync(csmFile(f))) fail(`missing ${csmFile(f)}`);

  // Loaded at run time so tsc never needs the (frozen, to be archived) CSM repo.
  const scaleMod = (await import(pathToFileURL(csmFile("scaleTasks.ts")).href)) as {
    scaleCategories: CsmCategory[];
    scaleTeamMembers: string[];
    scaleSourceDocument: SourceDoc;
    scaleTasksForVariant: (v: string) => CsmTask[];
  };
  const respondMod = (await import(pathToFileURL(csmFile("respondTasks.ts")).href)) as {
    teamMembers: string[];
    sourceDocument: SourceDoc;
    seedTasks: CsmTask[];
  };
  const bssMod = (await import(pathToFileURL(csmFile("bssTasks.ts")).href)) as {
    bssTeamMembers: string[];
    bssSourceDocument: SourceDoc;
    bssSeedTasks: CsmTask[];
    bssRetiredTaskIds: Set<string>;
  };

  // ── Scale ──
  // meta_google is the full set: every category, plus scl-309 injected in code.
  const scaleCsm = scaleMod.scaleTasksForVariant("meta_google");
  const scaleSteps = stepIndex(scaleClientStages);
  const scalePlaced = place(scaleCsm, SCALE_STEP_MAP, scaleSteps, [...SCALE_TEAM_ONLY, ...Object.keys(SCALE_UNPLACED)]);
  const scaleTeamOnlySet = new Set([...SCALE_TEAM_ONLY, ...Object.keys(SCALE_UNPLACED)]);
  for (const t of scaleCsm) if (!scalePlaced.has(t.id) && !scaleTeamOnlySet.has(t.id)) fail(`Scale task ${t.id} is not placed`);
  const categoryIdByName = new Map(scaleMod.scaleCategories.map((c) => [c.name, c.id]));
  const channelsFor = (t: CsmTask): ("meta" | "google")[] | undefined => {
    if (t.id === "scl-309") return ["google"];
    const catId = categoryIdByName.get(t.category);
    if (!catId) fail(`${t.id}: unknown category ${t.category}`);
    if (META_CATEGORY_IDS.includes(catId)) return ["meta"];
    if (GOOGLE_CATEGORY_IDS.includes(catId)) return ["google"];
    return undefined;
  };
  // File order = CSM order, except scl-309 (appended by code, sortOrder 309):
  // it moves to the top of its Google category, where its "Days 1-5" window puts it.
  const scaleOrdered = scaleCsm.filter((t) => t.id !== "scl-309");
  const firstGoogle = scaleOrdered.findIndex((t) => channelsFor(t)?.[0] === "google");
  scaleOrdered.splice(firstGoogle, 0, scaleCsm.find((t) => t.id === "scl-309")!);
  const scaleTasks = scaleOrdered.map((t) =>
    convert(t, { step: scalePlaced.get(t.id), completesWithSteps: SCALE_COMPLETES_WITH[t.id] }, { channels: channelsFor(t) }),
  );

  // ── Respond ──
  const respondCsm = respondMod.seedTasks;
  const respondSteps = stepIndex(respondClientStages);
  const respondPlaced = place(respondCsm, RESPOND_STEP_MAP, respondSteps, "rest");
  const respondTasks = respondCsm.map((t) => convert(t, { step: respondPlaced.get(t.id) }));

  // ── BSS (paused, reference) and Website (draft add-on) ──
  const bssCsm = bssMod.bssSeedTasks;
  const bssCategory = (name: string) => (name === "Intake & Kick-off" ? "Intake" : name);
  const bssTasks = bssCsm.map((t) => convert(t, {}, { category: bssCategory(t.category) }));
  const websiteDroppedDeps: { id: string; dropped: string[] }[] = [];
  const websiteTasks = WEBSITE_TASK_IDS.map((id) => {
    const t = bssCsm.find((x) => x.id === id) ?? fail(`missing ${id}`);
    const keep = t.dependencies.filter((d) => WEBSITE_TASK_IDS.includes(d));
    const dropped = t.dependencies.filter((d) => !WEBSITE_TASK_IDS.includes(d));
    if (dropped.length) websiteDroppedDeps.push({ id, dropped });
    return convert(t, {}, { category: bssCategory(t.category), dependencies: keep });
  });

  // Every role used must be a real one ("Unassigned" is not a role).
  const roleCheck = (name: string, tasks: TeamTask[], members: string[]) => {
    for (const t of tasks) if (t.role === "Unassigned" || !members.includes(t.role)) fail(`${name} ${t.id}: role "${t.role}" is not a team role`);
  };
  roleCheck("Scale", scaleTasks, scaleMod.scaleTeamMembers);
  roleCheck("Respond", respondTasks, respondMod.teamMembers);
  roleCheck("BSS", bssTasks, bssMod.bssTeamMembers);

  // The channel rule must give exactly CSM's own task set for every variant.
  const csmVariantSets: Record<string, number> = {};
  for (const [csmVariant, channels] of [["meta", ["meta"]], ["google", ["google"]], ["meta_google", ["meta", "google"]], ["bss_meta", ["meta"]]] as const) {
    const theirs = scaleMod.scaleTasksForVariant(csmVariant).map((t) => t.id).sort();
    const ours = scaleTasks.filter((t) => !t.channels || t.channels.some((c) => (channels as readonly string[]).includes(c))).map((t) => t.id).sort();
    if (theirs.join() !== ours.join()) fail(`Scale variant ${csmVariant}: channel rule gives ${ours.length} tasks, CSM gives ${theirs.length}`);
    csmVariantSets[csmVariant] = theirs.length;
  }

  // ── Outputs ──
  const outputs: Record<string, string> = {
    "products/scale/team-tasks.ts": taskFile("scaleTeamTasks", "Scale", "lib/scaleTasks.ts", scaleTasks),
    "products/respond/team-tasks.ts": taskFile("respondTeamTasks", "Respond", "lib/respondTasks.ts", respondTasks),
    "products/bss/team-tasks.ts": taskFile("bssTeamTasks", "BSS Launchpad (paused, reference only)", "lib/bssTasks.ts", bssTasks),
    "products/website/index.ts": websiteFile(websiteTasks, bssMod.bssSourceDocument),
  };
  outputs[REPORT_PATH] = report({
    csmRoot,
    hashes: Object.fromEntries(["scaleTasks.ts", "respondTasks.ts", "bssTasks.ts", "types.ts"].map((f) => [f, sha256(csmFile(f))])),
    scaleCsm,
    respondCsm,
    bssCsm,
    scaleTasks,
    respondTasks,
    bssTasks,
    websiteTasks,
    websiteDroppedDeps,
    retiredBss: [...bssMod.bssRetiredTaskIds],
    scaleSteps,
    respondSteps,
    csmVariantSets,
  });

  let changed = 0;
  for (const [rel, content] of Object.entries(outputs)) {
    const path = join(ROOT, rel);
    const same = existsSync(path) && readFileSync(path, "utf8") === content;
    if (!same) changed++;
    if (write && !same) writeFileSync(path, content);
    console.log(`${same ? "unchanged" : write ? "wrote    " : "differs  "} ${rel}`);
  }
  console.log(
    `Scale ${scaleTasks.length} tasks (${scaleTasks.filter((t) => t.step).length} behind a step), ` +
      `Respond ${respondTasks.length} (${respondTasks.filter((t) => t.step).length}), BSS ${bssTasks.length}, Website ${websiteTasks.length}. ` +
      `${brandChanges.length} "RT Digital" lines reworded.`,
  );
  if (!write && changed) console.log("Dry run. Re-run with --write to write the files.");
}

function websiteFile(tasks: TeamTask[], bssDoc: SourceDoc): string {
  return `// Website add-on: DRAFT. Seeded from the only Website task set that exists,
// BSS tasks bss-014…bss-017 (ids kept), so a website build can be sold beside
// Scale or Respond later. No client steps or timeline yet: both to be written
// with Jesse. Never seeded onto a client board while it is a draft.
//
// Generated once by scripts/products/import-csm-templates.ts on ${CONVERTED_ON}
// (see ${REPORT_PATH}).
// From here on this file is edited by hand: ask Claude, and bump the version
// with every change (npm run products:check enforces it).

import type { Product, TeamTask } from "../types";

const websiteTeamTasks: TeamTask[] = [
${tasksBody(tasks)}
];

export const website: Product = {
  id: "website",
  name: "Website add-on",
  version: "2026-10-16.1",
  status: "draft",
  totalDays: null,
  roles: ["Jesse Allan"],
  stages: [
    {
      id: "build",
      name: "Build",
      // BSS's build window (weeks 2 to 5), where these tasks came from.
      dayStart: 8,
      dayEnd: 35,
      statusNotes: [],
      steps: [],
    },
  ],
  teamTasks: websiteTeamTasks,
  variants: [],
  source: {
    from: "csm-dashboard lib/bssTasks.ts (bss-014…bss-017)",
    commit: "${CSM_COMMIT}",
    files: ["lib/bssTasks.ts", "lib/types.ts"],
    document: {
      title: ${JSON.stringify(bssDoc.title)},
      url: ${JSON.stringify(bssDoc.url)},
    },
    convertedOn: "${CONVERTED_ON}",
    report: "${REPORT_PATH}",
  },
};
`;
}

// ── Report ────────────────────────────────────────────────────────────────
type ReportInput = {
  csmRoot: string;
  hashes: Record<string, string>;
  scaleCsm: CsmTask[];
  respondCsm: CsmTask[];
  bssCsm: CsmTask[];
  scaleTasks: TeamTask[];
  respondTasks: TeamTask[];
  bssTasks: TeamTask[];
  websiteTasks: TeamTask[];
  websiteDroppedDeps: { id: string; dropped: string[] }[];
  retiredBss: string[];
  scaleSteps: Map<string, { stage: StageId; title: string; hidden: boolean }>;
  respondSteps: Map<string, { stage: StageId; title: string; hidden: boolean }>;
  csmVariantSets: Record<string, number>;
};

function cell(text: string) {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function variantCount(tasks: TeamTask[], channels: string[]) {
  return tasks.filter((t) => !t.channels || t.channels.some((c) => channels.includes(c))).length;
}

function report(r: ReportInput): string {
  const L: string[] = [];
  const all = [...r.scaleCsm, ...r.respondCsm, ...r.bssCsm];
  const titleOf = (id: string) => all.find((t) => t.id === id)?.title ?? "";
  const ids = (list: { id: string }[]) => list.map((t) => `\`${t.id}\``).join(", ");

  L.push("# Conversion report: CSM task lists → product files (October 2026)");
  L.push("");
  L.push(`Written by \`scripts/products/import-csm-templates.ts\` on ${CONVERTED_ON}. A one-off, kept for provenance. Plan: \`~/.claude/plans/temporal-waddling-wave.md\`, Phase 1.`);
  L.push("");
  L.push(`**Source:** \`~/Master/AI/csm-dashboard\` (frozen) at commit \`${CSM_COMMIT}\`. Read only; the CSM app was never run.`);
  L.push("");
  L.push("| File | sha256 |");
  L.push("|---|---|");
  for (const [f, h] of Object.entries(r.hashes)) L.push(`| \`lib/${f}\` | \`${h}\` |`);
  L.push("");
  L.push("**Needs Jesse:** the step mapping (review it in the sheets, `docs/products/*.md`) and the [flags](#flags-for-jesse-not-fixed) at the end.");
  L.push("");

  // Summary
  const behind = (tasks: TeamTask[]) => tasks.filter((t) => t.step).length;
  const unplaced = Object.keys(SCALE_UNPLACED).length;
  L.push("## Summary");
  L.push("");
  L.push("| Product | Status | Source tasks | In the product | Behind a client step | Team-only (stage level) | Flagged unplaced |");
  L.push("|---|---|---|---|---|---|---|");
  L.push(`| Scale | live | ${r.scaleCsm.length} (${r.scaleCsm.length - 1} in the list + \`scl-309\` injected in code) | ${r.scaleTasks.length} | ${behind(r.scaleTasks)} | ${r.scaleTasks.length - behind(r.scaleTasks) - unplaced} | ${unplaced} (team-only too) |`);
  L.push(`| Respond | live | ${r.respondCsm.length} | ${r.respondTasks.length} | ${behind(r.respondTasks)} | ${r.respondTasks.length - behind(r.respondTasks)} | 0 |`);
  L.push(`| BSS Launchpad | paused (reference) | ${r.bssCsm.length} (\`bss-002\` retired, not carried) | ${r.bssTasks.length} | 0 (no client steps converted) | ${r.bssTasks.length} | 0 |`);
  L.push(`| Website add-on | draft | 4 (\`bss-014\`…\`bss-017\`) | ${r.websiteTasks.length} | 0 (no client steps yet) | ${r.websiteTasks.length} | 0 |`);
  L.push("");
  L.push("Team tasks a client gets, by variant:");
  L.push("");
  L.push("| Variant | Channels | Team tasks |");
  L.push("|---|---|---|");
  L.push(`| Scale — Meta ads (\`meta\`) | meta | ${variantCount(r.scaleTasks, ["meta"])} |`);
  L.push(`| Scale — Google Ads (\`google\`) | google | ${variantCount(r.scaleTasks, ["google"])} |`);
  L.push(`| Scale — Meta + Google Ads (\`meta-google\`) | meta, google | ${variantCount(r.scaleTasks, ["meta", "google"])} |`);
  L.push(`| BSS Meta ads only (\`bss-meta\`) | meta (the Meta set) | ${variantCount(r.scaleTasks, ["meta"])} |`);
  L.push(`| CRM — Respond (\`respond\`) | none | ${r.respondTasks.length} |`);
  L.push("");
  L.push(`Checked id for id against CSM's own task sets (\`scaleTasksForVariant\`): ${Object.entries(r.csmVariantSets).map(([v, n]) => `${v} ${n}`).join(", ")}.`);
  L.push("");

  // Rules
  L.push("## Rules applied");
  L.push("");
  L.push("1. **Ids kept.** Every task keeps its CSM id (`scl-…`, `rsp-…`, `bss-…`). Client steps keep their portal ids.");
  L.push("2. **Wording.** Team side: CSM's title wins. Client side: the portal's wording wins. Client steps are verbatim copies of `lib/onboardingJourney.ts` and `lib/respondJourney.ts`; this script does not touch them.");
  const withNotes = [...r.scaleTasks, ...r.respondTasks, ...r.bssTasks].filter((t) => t.notes.trim()).length;
  L.push(`3. **Notes kept as guidance.** CSM gave new clients blank notes (\`seedTemplateTasksForClient\` dropped them unless \`useTemplateState\` was set), so the "Merged SOP steps" only showed on demo clients. Product files keep every template note on purpose, as the task's guidance. ${withNotes} tasks carry notes.`);
  L.push("4. **Stage = CSM phase.** Onboarding → `onboarding`, Build → `build`, Testing → `testing`, Go-Live → `go-live`, Post-Launch → `post-launch`, Support → `support` (team-only, never reaches the portal). Where a task's stage differs from its client step's stage it is kept and flagged, not moved.");
  L.push("5. **Scale channels**, by CSM's category rule (`scaleCategoriesForVariant`): categories `scale-04` and `scale-05` → `[\"meta\"]`; `scale-06` and `scl-309` → `[\"google\"]`. `bss-meta` gets the Meta set (CSM's `taskSetForVariant`).");
  L.push("6. **`scl-309`** existed only in code (`scaleTasksForVariant` pushed it for Google variants). It is now an ordinary task with `channels: [\"google\"]`, placed at the top of the Google category (its `Days 1-5` window) rather than at the end of the list.");
  L.push("7. **Roles** are each product's CSM team list, minus \"Unassigned\" (no task uses it; an unassigned task simply has no assignee on the board). Person-named roles (Rich, Joseph, Accounts - Sandy) are kept for now.");
  L.push("8. **Order** is CSM's order (by `sortOrder`), apart from `scl-309`.");
  L.push("9. **Placement.** Every task sits in exactly one place: behind one client step (`step`), or team-only at stage level. `scl-040` sits behind `ob-6` and counts as done when the client finishes `ob-6`, `ob-6b` and `ob-6c` (`completesWithSteps`).");
  L.push("");

  // Changes
  L.push("## Changes made");
  L.push("");
  L.push("### \"RT Digital\" → \"allconvos.ai\" (CSM hand-off note 1)");
  L.push("");
  L.push("Every exact \"RT Digital\" in a team task's title or notes. Jesse wants no RT Digital anywhere for BSS, and `bss-meta` runs on Scale's tasks.");
  L.push("");
  L.push("| Task | Field | Before | After |");
  L.push("|---|---|---|---|");
  for (const c of brandChanges) L.push(`| \`${c.id}\` | ${c.field} | ${cell(c.before)} | ${cell(c.after)} |`);
  L.push("");
  L.push("Check these still match the real accounts: `scl-001` (the GHL sub-account's name), `scl-104` (the Scribe guide is still titled \"How to Add RT Digital as a Partner…\"), `scl-107` (the Meta Business Portfolio's name), `scl-132` (the Google Ads MCC's name). Other spellings were left alone, see the flags.");
  L.push("");
  L.push("`scl-104`'s client-facing portal title (\"Add RT Digital as a Partner in your Meta Business Suite\") is dropped with the other portal fields. The client sees the portal's own `bd-3` wording, \"Grant us partner access to your Meta Business Suite\".");
  L.push("");
  L.push("### BSS");
  L.push("");
  const intake = r.bssCsm.filter((t) => t.category === "Intake & Kick-off");
  L.push(`- Category \"Intake & Kick-off\" → \"Intake\" (CSM hand-off note 5; the kick-off call \`bss-002\` is retired): ${ids(intake)}.`);
  L.push("- Roles: \"Jesse Allan\" only (hand-off note 4).");
  L.push(`- Retired and not carried over: ${r.retiredBss.map((id) => `\`${id}\` (${titleOf(id) || "kick-off call"})`).join(", ")}.`);
  L.push("- Reference only: status `paused`. No client steps converted; BSS's client journey stays in `lib/bssJourney.ts` (also paused). `productForClientType(\"bss\")` returns null.");
  L.push("");
  L.push("### Website add-on (draft)");
  L.push("");
  L.push(`- Copied from BSS, ids kept: ${ids(r.websiteTasks)}, category \"Website Build\", role \"Jesse Allan\".`);
  L.push(`- Dependencies on BSS tasks outside the add-on were dropped: ${r.websiteDroppedDeps.map((d) => `\`${d.id}\` (was after ${d.dropped.map((x) => `\`${x}\``).join(", ")})`).join("; ")}.`);
  L.push("- No client steps and no timeline yet (`totalDays: null`). One Build stage, days 8–35, borrowed from BSS's build window.");
  L.push("");
  L.push("### Respond");
  L.push("");
  const respondBuild = r.respondTasks.filter((t) => t.stage === "build");
  L.push(`- The portal's Respond journey has no Build stage (Onboarding days 1–2, then Testing days 3–8). CSM's ${respondBuild.length} Build tasks keep their phase, so the product gets a **team-only Build stage** (days 2–7, from their due windows) that never reaches the portal: ${ids(respondBuild)}.`);
  L.push("- Respond's client step ids are CSM template ids, so 12 team tasks share an id with the step they sit behind (`rsp-012` behind `rsp-012`, and so on). Step ids and task ids are separate namespaces; the integrity check allows it.");
  L.push("");

  // Dropped
  L.push("## Dropped (not carried into product files)");
  L.push("");
  const statusGroups = new Map<string, string[]>();
  for (const t of all) if (t.status !== "queued") statusGroups.set(t.status, [...(statusGroups.get(t.status) ?? []), t.id]);
  L.push(`- **\`status\`**: demo progress, not template content. Non-queued in the source: ${[...statusGroups].map(([s, list]) => `${s} ${list.map((x) => `\`${x}\``).join(", ")}`).join("; ")}. Every task starts queued on a new board.`);
  const blocked = all.filter((t) => t.blockedReason);
  L.push(`- **\`blockedReason\`**: demo state. ${blocked.map((t) => `\`${t.id}\` "${t.blockedReason}"`).join("; ")}.`);
  const looms = all.filter((t) => t.loomUrl || t.loomTitle);
  L.push(`- **\`loomUrl\` / \`loomTitle\`**: ${looms.length ? ids(looms) : "none set in any template"}. Phase 2 boards hold a Loom link per client task.`);
  L.push("- **`sortOrder`**: file order is the order.");
  L.push("- **Portal fields** (`portalVisible`, `portalTitle`, `portalNote`, `portalActionRequired`, `portalActionUrl`, `portalActionLabel`, `portalConfigured`): the client steps speak to the client now. The portal-visible tasks, with the step that replaces their portal wording:");
  L.push("");
  L.push("| Task | CSM portal title (dropped) | CSM portal note (dropped) | Now behind client step |");
  L.push("|---|---|---|---|");
  const placedStep = (id: string) => [...r.scaleTasks, ...r.respondTasks].find((t) => t.id === id)?.step;
  for (const t of all.filter((x) => x.portalVisible)) {
    const step = placedStep(t.id);
    const steps = t.id.startsWith("scl") ? r.scaleSteps : r.respondSteps;
    const where = t.id.startsWith("bss") ? "(BSS, reference)" : step ? `\`${step}\` ${cell(steps.get(step)?.title ?? "")}` : "none (team-only)";
    L.push(`| \`${t.id}\` | ${cell(t.portalTitle)} | ${cell(t.portalNote)} | ${where} |`);
  }
  L.push("");

  // Mapping
  const mapping = (tasks: TeamTask[], steps: Map<string, { stage: StageId; title: string; hidden: boolean }>, clientOnly: Record<string, string>) => {
    L.push("| Client step | Stage | Team tasks behind it |");
    L.push("|---|---|---|");
    for (const [id, s] of steps) {
      const behindIt = tasks.filter((t) => t.step === id).map((t) => `\`${t.id}\``);
      const also = tasks.filter((t) => t.step !== id && t.completesWithSteps?.includes(id)).map((t) => `\`${t.id}\` (done with it)`);
      const text = clientOnly[id] ? `client only: ${clientOnly[id]}` : [...behindIt, ...also].join(", ");
      L.push(`| \`${id}\` ${cell(s.title)}${s.hidden ? " (hidden)" : ""} | ${s.stage} | ${text} |`);
    }
    L.push("");
    L.push("Team-only, at stage level:");
    L.push("");
    for (const stage of ["onboarding", "build", "testing", "go-live", "post-launch", "support"] as StageId[]) {
      const list = tasks.filter((t) => !t.step && t.stage === stage);
      if (list.length) L.push(`- ${stage}: ${list.map((t) => `\`${t.id}\`${SCALE_UNPLACED[t.id] ? " (flagged)" : ""}`).join(", ")}`);
    }
    L.push("");
  };
  L.push("## Step mapping as applied");
  L.push("");
  L.push("### Scale");
  L.push("");
  mapping(r.scaleTasks, r.scaleSteps, SCALE_CLIENT_ONLY);
  L.push("### Respond");
  L.push("");
  mapping(r.respondTasks, r.respondSteps, RESPOND_CLIENT_ONLY);

  // Flags
  L.push("## Flags for Jesse (not fixed)");
  L.push("");
  L.push("### 1. Tasks with no client step");
  L.push("");
  L.push("Placed team-only at stage level for now. Decide where they go, or retire them.");
  L.push("");
  for (const [id, why] of Object.entries(SCALE_UNPLACED)) L.push(`- \`${id}\` "${titleOf(id)}": ${why}`);
  L.push("");
  L.push("### 2. LaunchBay / Magic Link wording");
  L.push("");
  L.push("The team works in this portal now, not LaunchBay. Titles still naming LaunchBay or the Magic Link:");
  L.push("");
  const lb = /LaunchBay|Magic Link/i;
  for (const [name, list] of [["Scale", r.scaleTasks], ["Respond", r.respondTasks]] as const) {
    const titled = list.filter((t) => lb.test(t.title));
    const noted = list.filter((t) => !lb.test(t.title) && lb.test(t.notes));
    L.push(`- ${name}, ${titled.length} titles: ${ids(titled)}. Also in the notes of ${ids(noted)}.`);
  }
  L.push("");
  L.push("### 3. Respond go-live: day 14 in CSM, day 10 in the portal");
  L.push("");
  const lateRespond = r.respondTasks.filter((t) => {
    const m = /^Days?\s+(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(t.due);
    return m && Number(m[2] ?? m[1]) > 10;
  });
  L.push(`The portal promises go-live on day 10 (\`respondJourneyTotalDays\`); CSM's windows run to day 14. \`rsp-019\` tells the client "14 days to Go-Live". Tasks due after day 10: ${lateRespond.map((t) => `\`${t.id}\` (${t.due})`).join(", ")}.`);
  L.push("");
  L.push("### 4. `ob-crm` timing");
  L.push("");
  L.push("The client is asked to log into their CRM in Onboarding (days 1–2), but `scl-189` (set up the GHL sub-account and add the client as a user) is a Build task due days 8–13.");
  L.push("");
  L.push("### 5. Team tasks in a different stage from their client step");
  L.push("");
  const mismatches: string[] = [];
  for (const [list, steps] of [[r.scaleTasks, r.scaleSteps], [r.respondTasks, r.respondSteps]] as const) {
    for (const t of list) {
      const s = t.step ? steps.get(t.step) : undefined;
      if (s && s.stage !== t.stage) mismatches.push(`- \`${t.id}\` "${t.title}" (${t.stage}, ${t.due}) sits behind \`${t.step}\` (${s.stage}).`);
    }
  }
  L.push(...mismatches);
  L.push("");
  L.push("Kept as CSM had them. The product sheets show each one under its step and note the different stage.");
  L.push("");
  L.push("### 6. Brand wording left as it is");
  L.push("");
  L.push("Only the exact phrase \"RT Digital\" was changed. These name real systems, so they were left for Jesse:");
  L.push("");
  const other = /RTDigital|\bRTD\b|rtdigital|rt-d\.com/;
  for (const t of [...r.scaleTasks, ...r.respondTasks, ...r.bssTasks]) {
    for (const f of ["title", "notes"] as const) {
      for (const line of t[f].split("\n")) if (other.test(line)) L.push(`- \`${t.id}\` ${f}: ${line.replace(/^- /, "")}`);
    }
  }
  L.push("- Client-facing, in the portal's own steps (protected, verbatim): `bd-3`'s guide link is the Scribe \"How_to_Add_RT_Digital_as_a_Partner…\"; `ob-crm` links to `crm.rtdigital.agency`; the booking links are `go.rt-d.com/jesse30`.");
  L.push("");
  L.push("### 7. Person-named roles");
  L.push("");
  L.push("Scale and Respond keep CSM's roles, including people: Rich, Joseph, Accounts - Sandy. Keep, or rename to functions (plan, question 9).");
  L.push("");
  return L.join("\n") + "\n";
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
