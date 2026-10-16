/**
 * Renders the readable product sheets, docs/products/<id>.md, from the product
 * files. The sheets are generated and committed: Jesse reads them, Claude
 * changes the product files.
 *
 *   npm run products:render              write the sheets
 *   npm run products:render -- --check   exit 1 if any sheet is out of date
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { productList } from "../../products/index";
import { allSteps, dueDaysFor, stepTree, stepVisibleFor, teamTasksFor, type StageNode } from "../../products/load";
import type { ClientStep, Product, ProductStage, ProductVariant, TeamTask } from "../../products/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const code = (id: string) => `\`${id}\``;
const channelLabel = (channels?: readonly string[]) =>
  !channels || channels.length === 0 ? "" : channels.length === 1 ? `${channels[0] === "meta" ? "Meta" : "Google"} only` : channels.join(" + ");

function stageDays(stage: ProductStage): string {
  if (stage.teamOnly && stage.ongoing) return "team only, as needed";
  const days = stage.dayStart === stage.dayEnd ? `day ${stage.dayStart}` : `days ${stage.dayStart}–${stage.dayEnd}`;
  if (stage.teamOnly) return `team only, ${days}`;
  return stage.ongoing ? `${days} on, ongoing` : days;
}

function dueLabel(task: TeamTask): string {
  const days = dueDaysFor(task);
  if (!days) return task.due;
  return task.dueDays ? `${task.due} (days ${days.start}–${days.end})` : task.due;
}

/** What the portal asks of the client on this step, in a few words. */
function stepKinds(step: ClientStep): string[] {
  const kinds: string[] = [];
  if (step.interviewAgentId || step.interview) kinds.push("voice interview");
  if (step.formId) kinds.push(`form \`${step.formId}\``);
  if (step.bookingUrl) kinds.push("booking calendar");
  if (step.hasUpload) kinds.push("upload");
  if (step.hasEditableContent) kinds.push("work to review");
  if (step.notePrompt) kinds.push(step.noteRequired ? "note (required)" : "note");
  else if (step.noteRequired) kinds.push("answer required");
  if (step.videoUrl) kinds.push("video");
  if (step.guideUrl) kinds.push("guide link");
  if (step.embedUrl) kinds.push("embedded form");
  if (step.steps) kinds.push(`${step.steps.length} numbered steps`);
  if (step.inviteEmail) kinds.push("invite email");
  if (step.showPortalLink) kinds.push("portal link");
  if (step.important) kinds.push("\"Important\" box");
  if (step.awaitingTeam) kinds.push("shown as with the team");
  return kinds;
}

function taskRow(task: TeamTask, stepStage?: string): string {
  const marks: string[] = [];
  const channels = channelLabel(task.channels);
  if (channels) marks.push(channels);
  if (stepStage && task.stage !== stepStage) marks.push(`team stage: ${task.stage}`);
  if (task.completesWithSteps) marks.push(`done when the client finishes ${task.completesWithSteps.map(code).join(", ")}`);
  const title = `${code(task.id)} ${cell(task.title)}${marks.length ? ` _(${marks.join("; ")})_` : ""}`;
  const after = task.dependencies.length ? task.dependencies.map(code).join(", ") : "";
  return `| ${title} | ${cell(task.role)} | ${cell(dueLabel(task))} | ${task.priority} | ${after} |`;
}

function guidance(tasks: TeamTask[], L: string[]) {
  const withNotes = tasks.filter((t) => t.notes.trim());
  if (!withNotes.length) return;
  L.push("");
  L.push(`<details><summary>Guidance for the team (${withNotes.length} ${withNotes.length === 1 ? "task" : "tasks"})</summary>`);
  L.push("");
  for (const t of withNotes) {
    L.push(`**${code(t.id)} ${t.title}**`);
    L.push("");
    L.push(t.notes.trim());
    L.push("");
  }
  L.push("</details>");
}

function taskTable(tasks: TeamTask[], L: string[], stepStage?: string) {
  L.push("| Team task | Role | Due | Priority | After |");
  L.push("|---|---|---|---|---|");
  for (const t of tasks) L.push(taskRow(t, stepStage));
  guidance(tasks, L);
}

function variantTweaks(variant: ProductVariant): string[] {
  const p = variant.portal;
  const lines: string[] = [];
  const look: string[] = [];
  if (p.brandName) look.push(`named **${p.brandName}**`);
  if (p.tagline) look.push(`tagline "${p.tagline}"`);
  if (p.lockedLook) look.push(`look fixed to \`${p.lockedLook}\``);
  if (p.hidesIncentive) look.push("no $200 \"move fast\" popup");
  if (look.length) lines.push(`- ${look.join(" · ")}`);
  if (p.introVideo) lines.push(`- Intro video after "Get started": "${p.introVideo.title}" (\`${p.introVideo.src}\`)`);
  for (const [id, note] of Object.entries(p.taskNotes ?? {})) lines.push(`- Note on ${code(id)}: "${note}"`);
  for (const [id, detail] of Object.entries(p.taskDetails ?? {})) lines.push(`- Description of ${code(id)} replaced with: "${detail}"`);
  const hidden: string[] = [];
  if (p.hiddenTaskVideos?.length) hidden.push(`video on ${p.hiddenTaskVideos.map(code).join(", ")}`);
  if (p.hiddenTaskBooking?.length) hidden.push(`booking calendar on ${p.hiddenTaskBooking.map(code).join(", ")}`);
  if (p.hiddenTaskPlayground?.length) hidden.push(`live AI test on ${p.hiddenTaskPlayground.map(code).join(", ")}`);
  if (p.hiddenTaskImportant?.length) hidden.push(`"Important" box on ${p.hiddenTaskImportant.map(code).join(", ")}`);
  if (hidden.length) lines.push(`- Hidden: ${hidden.join("; ")}`);
  return lines;
}

function stageSection(node: StageNode, index: number, L: string[]) {
  const { stage } = node;
  L.push(`## ${index + 1}. ${stage.name} · ${stageDays(stage)}`);
  L.push("");
  if (stage.blurb) {
    L.push(`_${stage.blurb}_`);
    L.push("");
  }
  if (stage.statusNotes.length) {
    L.push(`Status notes the client sees: ${stage.statusNotes.map((n) => `"${n}"`).join(" · ")}`);
    L.push("");
  }
  for (const { step, tasks, alsoCompletedBy } of node.steps) {
    const marks: string[] = [];
    if (step.hidden) marks.push("hidden in the portal");
    const channels = channelLabel(step.channels);
    if (channels) marks.push(channels);
    if (step.clientOnly) marks.push("client only");
    L.push(`### ${code(step.id)} ${step.title}${marks.length ? ` _(${marks.join(", ")})_` : ""}`);
    L.push("");
    L.push(`> ${cell(step.detail)}`);
    L.push("");
    const kinds = stepKinds(step);
    if (kinds.length) {
      L.push(`Portal: ${kinds.join(" · ")}`);
      L.push("");
    }
    if (step.clientOnly && !tasks.length && !alsoCompletedBy.length) {
      L.push("No team task behind this step.");
      L.push("");
      continue;
    }
    if (alsoCompletedBy.length) {
      L.push(`Done with: ${alsoCompletedBy.map((t) => `${code(t.id)} (behind ${code(t.step ?? "")})`).join(", ")}`);
      L.push("");
    }
    if (tasks.length) {
      taskTable(tasks, L, stage.id);
      L.push("");
    }
  }
  if (node.teamOnly.length) {
    L.push(stage.teamOnly ? `### Team work` : `### Team-only work in ${stage.name}`);
    L.push("");
    const byCategory = new Map<string, TeamTask[]>();
    for (const t of node.teamOnly) byCategory.set(t.category, [...(byCategory.get(t.category) ?? []), t]);
    L.push("| Team task | Role | Due | Priority | After |");
    L.push("|---|---|---|---|---|");
    for (const [category, tasks] of byCategory) {
      L.push(`| **${cell(category)}** | | | | |`);
      for (const t of tasks) L.push(taskRow(t));
    }
    guidance(node.teamOnly, L);
    L.push("");
  }
  if (!node.steps.length && !node.teamOnly.length) {
    L.push("Nothing here yet.");
    L.push("");
  }
}

export function renderSheet(product: Product): string {
  const L: string[] = [];
  const steps = allSteps(product);
  const behind = product.teamTasks.filter((t) => t.step).length;
  L.push(`<!-- GENERATED by scripts/products/render.ts from products/${product.id}/. Do not edit: ask Claude to change the product files, then run npm run products:render. -->`);
  L.push("");
  L.push(`# ${product.name}`);
  L.push("");
  L.push(`> **Generated sheet. Ask Claude to change it.** Source: \`products/${product.id}/\`. How changes work: [README](README.md).`);
  L.push("");
  L.push("| | |");
  L.push("|---|---|");
  L.push(`| Version | \`${product.version}\` |`);
  const statusText: Record<Product["status"], string> = {
    live: "live: new clients start on it",
    paused: "paused: reference only, never put on a board",
    draft: "draft: being written, never put on a board",
  };
  L.push(`| Status | ${statusText[product.status]} |`);
  L.push(`| Journey | ${product.totalDays === null ? "timeline not set yet" : `${product.totalDays} days to go-live`} |`);
  if (steps.length) {
    const clientOnly = steps.filter((s) => s.clientOnly).length;
    const hidden = steps.filter((s) => s.hidden).length;
    L.push(`| Client steps | ${steps.length} (${clientOnly} client only, ${hidden} hidden in the portal) |`);
  } else {
    L.push("| Client steps | none in this product file |");
  }
  L.push(`| Team tasks | ${product.teamTasks.length} (${behind} behind a client step, ${product.teamTasks.length - behind} team-only) |`);
  const reportLink = product.source.report.replace(/^docs\/products\//, "");
  L.push(`| Converted from | ${product.source.from} at \`${product.source.commit}\` on ${product.source.convertedOn}: [conversion report](${reportLink}), with [open questions for Jesse](${reportLink}#flags-for-jesse-not-fixed) |`);
  if (product.source.document) L.push(`| Source document | [${cell(product.source.document.title)}](${product.source.document.url}) |`);
  L.push("");
  if (product.status === "live" && steps.length) {
    L.push("Until the portal reads product files, the client wording here mirrors the live portal's code templates, and `npm run products:check` proves the two match.");
    L.push("");
  }

  // Variants
  L.push("## Variants");
  L.push("");
  if (!product.variants.length) {
    L.push("None. No client type runs on this product.");
    L.push("");
  } else {
    L.push("| Variant | Client type | Channels | Client steps shown | Team tasks |");
    L.push("|---|---|---|---|---|");
    for (const v of product.variants) {
      const shown = steps.filter((s) => stepVisibleFor(s, v)).length;
      L.push(`| ${cell(v.label)} | ${code(v.clientType)} | ${v.channels?.join(", ") ?? "none"} | ${shown} | ${teamTasksFor(product, v).length} |`);
    }
    L.push("");
    const tweaked = product.variants.filter((v) => Object.keys(v.portal).length);
    if (tweaked.length) {
      L.push("### Portal tweaks by variant");
      L.push("");
      for (const v of tweaked) {
        L.push(`**${v.label}** (${code(v.clientType)})`);
        L.push("");
        L.push(...variantTweaks(v));
        L.push("");
      }
    }
  }

  // Roles
  L.push("## Roles");
  L.push("");
  L.push("| Role | Team tasks |");
  L.push("|---|---|");
  for (const role of product.roles) L.push(`| ${cell(role)} | ${product.teamTasks.filter((t) => t.role === role).length} |`);
  L.push("");

  // Stages
  L.push("## Stages");
  L.push("");
  L.push("Each stage lists the client's steps in portal order, with the team tasks behind each step, then any team-only work. _Meta only_ / _Google only_ marks work for one ad channel. \"After\" lists the tasks to finish first.");
  L.push("");
  stepTree(product).forEach((node, i) => stageSection(node, i, L));

  return L.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/** Every generated sheet, by repo-relative path. */
export function renderSheets(): Record<string, string> {
  return Object.fromEntries(productList.map((p) => [`docs/products/${p.id}.md`, renderSheet(p)]));
}

/** Paths whose committed sheet differs from a fresh render. */
export function staleSheets(): string[] {
  return Object.entries(renderSheets())
    .filter(([rel, content]) => {
      const path = join(ROOT, rel);
      return !existsSync(path) || readFileSync(path, "utf8") !== content;
    })
    .map(([rel]) => rel);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  if (process.argv.includes("--check")) {
    const stale = staleSheets();
    if (stale.length) {
      console.error(`FAIL sheets out of date: ${stale.join(", ")}. Run npm run products:render.`);
      process.exit(1);
    }
    console.log(`PASS sheets current (${productList.length} sheets).`);
  } else {
    for (const [rel, content] of Object.entries(renderSheets())) {
      const path = join(ROOT, rel);
      const same = existsSync(path) && readFileSync(path, "utf8") === content;
      if (!same) writeFileSync(path, content);
      console.log(`${same ? "unchanged" : "wrote    "} ${rel}`);
    }
  }
}
