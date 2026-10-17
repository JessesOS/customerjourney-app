/**
 * One-off: turn section 3 of the BSS handover spec (products/bss-custom/spec.md)
 * into the bss-custom product's team tasks. Kept for provenance, not as a sync:
 * after the first run the task file is edited by hand (ask Claude), so
 * re-running with --write would overwrite those edits.
 *
 *   npx tsx scripts/products/import-bss-spec.ts            dry run: counts, placement and every title
 *   npx tsx scripts/products/import-bss-spec.ts --write    write products/bss-custom/team-tasks.ts
 *
 * Rules (Jesse, 2026-10-17: Fin's side short, the team side down to every
 * granular detail):
 *   - One task per row of every table in 3.A to 3.I, one per message in 3.E,
 *     one per tag group in 3.C4, plus the global workflow stop rules (D00).
 *   - Not in scope (B240, B703, D26, F14, G03, 3.H, 3.J): one task that lists
 *     them all, word for word. 3.K commitments go into A22's notes (A22 is the
 *     addendum that puts them in writing).
 *   - Every column the title doesn't use is kept in the notes, word for word,
 *     with the status on 17 Oct. Titles are the spec's wording, cut short where long.
 *   - Placement: behind the client step the task supports (PLACE), else
 *     team-only in the stage its weeks fall in. Fin's own actions finish when
 *     he finishes their step (COMPLETES).
 *   - Dependencies: the spec ids in "Depends on" that are tasks here (ranges expanded).
 *   - Weeks count from the day the client starts: week n = days 7n-6 to 7n;
 *     months 2 to 8 = days 43 to 240.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bssCustomSteps } from "../../products/bss-custom/client-steps";
import type { DueDays, StageId, TaskPriority, TeamTask } from "../../products/types";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SPEC = "products/bss-custom/spec.md";
const OUT = "products/bss-custom/team-tasks.ts";
const ROLE = "Jesse Allan";
const WRITE = process.argv.includes("--write");

const stepStage = new Map(bssCustomSteps.map(({ stage, step }) => [step.id, stage]));

// ── Placement: spec id → the client step the task sits behind ──────────────
const PLACE: Record<string, string> = {};
const place = (step: string, ids: string[]) => { for (const id of ids) PLACE[id] = `bssc-${step}`; };
const range = (letter: string, from: number, to: number, width = 2) => Array.from({ length: to - from + 1 }, (_, i) => `${letter}${String(from + i).padStart(width, "0")}`);
place("kickoff", ["A09"]);
place("access-site", ["A10", "A13", "B602", "B310"]);
place("access-tools", ["A14", "B501", "B502", "B507"]);
place("review-1", ["A23", ...range("B", 101, 110, 3), "B114", "B201", "B202", ...range("B", 206, 213, 3), "B216", "B217", "B218", "B221", "B223", "B224", "B225", "B226", "B227", "B229", "B230", "B233", "B234", "B235", "B236", "B241", "B311"]);
place("questions", ["A15", "A17", "A18", "C701"]);
place("assets", ["B214", "B228", "B231", "B301", "B302", "B303", "B304", "B308"]);
place("journey-map", ["A11", "A12", "A16", "A19", "A20", "A21", "B232", "B604", "C101"]);
place("crm-plan", [...range("C", 201, 206, 3), ...range("C", 301, 324, 3), "C4-source", "C4-status", "C4-webinar", "C4-consent", "C4-engagement", "C4-interest", "C501"]);
place("review-2", ["B203", "B242", "B243", "B244", "B802"]);
place("contacts", ["C904", "C905"]);
place("signoff", ["B245"]);
place("test-booking", ["B204", "B205", "B503", "B504", "B505", "B506", "B803", "B804", "B805", "B809", "C601", "C602", "C604", "C802", "G01"]);
place("launch-day", ["X-launch-date", "B608"]);
place("ai-agent", [...range("F", 1, 12), "D24"]);
place("walkthrough", ["I01", "I02", "I05", "B113", "C503"]);
place("live-check", ["B607", "B111", "B112", "B801", "B808", "B810", "G07"]);
place("webinar", ["B305", "B306", "B237", "B238", "B508", "C808", "D11", "D12", "D13", "B806", "I04", "G02"]);
place("onboarding-map", ["X-onboarding-map", "D10", "C807", "C810", "I03"]);
place("reactivation", ["D15"]);
place("check-ins", ["I06", "I07", "F13"]);
// Messages sit behind the step where Fin approves them.
const MESSAGE_STEP: Record<string, string> = { E1: "messages", E2: "messages", E3: "messages", E4: "messages", E5: "messages", E6: "messages", E7: "messages", E8: "webinar", E9: "onboarding-map", E10: "reactivation", E11: "messages" };

/** Fin's own actions: done when he finishes these steps. */
const COMPLETES: Record<string, string[]> = {
  A09: ["bssc-kickoff"],
  A10: ["bssc-access-site", "bssc-access-tools"],
  B602: ["bssc-access-site"],
  B502: ["bssc-access-tools"],
  A18: ["bssc-questions"],
  B202: ["bssc-review-1"],
  B241: ["bssc-review-1"],
  A12: ["bssc-journey-map"],
  C206: ["bssc-crm-plan"],
  C904: ["bssc-contacts"],
  B245: ["bssc-signoff"],
  B809: ["bssc-test-booking"],
  F11: ["bssc-ai-agent"],
  I01: ["bssc-walkthrough"],
};

/** On the path to launch: access, evaluation, sign-off, rebuild, launch. */
const CRITICAL = new Set(["A10", "A12", "A13", "A14", "B602", "B245", "B605", "B607"]);

/** Left out of the board, listed word for word in the scope task. */
const OUT_OF_SCOPE = new Set(["B240", "B703", "D26", "F14", "G03"]);

/** Tables without a "When" column: the weeks they fall in. */
const WHEN_DEFAULT: Record<string, string> = {
  B301: "W1 to W2", B302: "W1 to W2", B303: "W1 to W2", B304: "W1 to W2", B305: "W7 to W9", B306: "W7 to W10", B307: "M2+",
  B308: "W1 to W2", B309: "Build", B310: "W1 to W2", B311: "Done (pitch build)",
  G01: "W5 to W6", G02: "W7 to W9", G04: "W5", G05: "W5", G06: "W7 to W10", G07: "W6",
};
const SECTION_WHEN: Record<string, string> = { B4: "W5", C2: "W2 to W3", C3: "W3", C4: "W3" };

/** Where a task with no weeks goes when it isn't behind a step. */
const SECTION_STAGE: Record<string, StageId> = { A: "onboarding", B1: "onboarding", B2: "onboarding", B3: "onboarding", B4: "testing", B5: "testing", B6: "build", B7: "testing", B8: "testing", D: "go-live", E: "go-live", F: "go-live", G: "testing", I: "post-launch" };

const CATEGORY: Record<string, string> = {
  A: "Onboarding & admin",
  B1: "Website: global", B2: "Website: pages", B3: "Website: assets", B4: "Website: forms", B5: "Booking & calendar", B6: "Domain & hosting", B7: "Tracking & analytics", B8: "Website: testing",
  C1: "CRM: setup & users", C2: "CRM: pipelines", C3: "CRM: custom fields", C4: "CRM: tags", C5: "CRM: lists, score & dashboard", C6: "CRM: calendars", C7: "Phone, SMS & email", C8: "CRM: integrations", C9: "CRM: contact import",
  D: "Automations",
  E1: "Messages: speed to lead", E2: "Messages: missed call", E3: "Messages: abandoned booking", E4: "Messages: call booked", E5: "Messages: after the sales call", E6: "Messages: new-lead nurture",
  E7: "Messages: welcome & education", E8: "Messages: webinar", E9: "Messages: client onboarding", E10: "Messages: reactivation", E11: "Messages: review request", E12: "Messages: internal alerts",
  F: "AI lead agent", G: "Funnels", I: "Training & support",
};

/** Titles the cutter doesn't get right: spec id → title (the full wording stays in the notes). */
const TITLE: Record<string, string> = {
  A13: `Analyse Fin's existing app (the "vibe-coded CRM"): keep, migrate or replace`,
  A25: "Fix the client-portal booking link (dead Cal.com link)",
  B201: "Book a Call quiz: redesign the qualification pop-up",
  B202: "Fin: decide which of the five quiz question improvements to make (Q7)",
  B205: "Quiz: live data handling (save first, sync to GHL with retries, Calendly webhook confirms)",
  B230: `Fin (asks Sean): Sean's endorsement, "Gday" vs "G'day", original photo (Q10 to Q12)`,
  B231: "Fin: collect each other partner's name, photo or logo, welcome message and OK on wording",
  B241: "Fin reviews draft 1 in the hub (26 questions)",
  B305: "Asset from Fin: webinar welcome video (Fin films)",
  B408: "Every form: SMS consent, privacy link, never-share-seed-phrase line",
  B506: "Direct Calendly links that skip the quiz: flag missing answers, short pre-call form",
  B604: "Choose the publish route (recommended: through Fin's Lovable project)",
  B701: "Tagged links (UTM + GHL trigger links) for bio, YouTube, partners and webinar ads",
  B806: "Test: webinar end to end (registration to the call-booked journey)",
  C104: "Business profile: name, address, time zone (Australia/Brisbane), logo, colours, signature",
  C105: "Users and permissions: Fin, Jesse, each coach, future sales team",
  C501: "Lead score rules (draft): hot, warm and cold",
  C502: "Smart lists: past clients, never booked, by source, no-shows, hot leads and more",
  C503: "Dashboard: leads by source, bookings, show rate, conversions, partners, webinar",
  C601: "Calendly ↔ GHL: bookings, reschedules and cancels update GHL",
  C706: "Email sending domain: a dedicated subdomain with SPF, DKIM and DMARC",
  C801: "Calendly: connect to GHL (see C601 to C604)",
  C802: "Website quiz: reliable sync to GHL (retries, alert, correlation ID)",
  C808: "Webinar platform: registration → unique join link → attendance back to GHL",
  C809: "Partner system: carry the partner ID from link to payment; partner report",
  C901: "Export existing contacts (GHL, Supabase tables, any other lists)",
  "E4.1": "Email, immediately: Confirmation (date, time, Zoom, reschedule and cancel links)",
  "E4.4": "Email, warm-up 2 (if booked 3+ days out): The offer explained, proof, confidence",
  "E8.1": "Email, on registration: Confirmed (date, time, calendar links, private joining link)",
};

// ── Read the spec ─────────────────────────────────────────────────────────
type Row = { section: string; sectionTitle: string; cells: Record<string, string>; line: number };

const strip = (s: string) => s.replace(/\*\*/g, "").trim();
const plain = (s: string) => strip(s).replace(/`/g, "");
const split = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const empty = (v: string | undefined) => v === undefined || v === "" || v === "–" || v === "-";

const lines = readFileSync(join(ROOT, SPEC), "utf8").split("\n");
const start = lines.findIndex((l) => l.startsWith("## 3."));
const end = lines.findIndex((l) => l.startsWith("## 4."));
if (start === -1 || end === -1) throw new Error(`${SPEC}: sections 3 and 4 not found`);

const rows: Row[] = [];
const bullets: Record<string, string[]> = {};
const paragraphs: Record<string, string[]> = {};
let section = "";
let sectionTitle = "";
for (let i = start + 1; i < end; i++) {
  const line = lines[i];
  let m: RegExpExecArray | null;
  if ((m = /^### 3\.([A-K]) (.+)$/.exec(line))) { section = m[1]; sectionTitle = m[2]; continue; }
  if ((m = /^#### ([A-K]\d+)\. (.+)$/.exec(line))) { section = m[1]; sectionTitle = m[2]; continue; }
  if (line.startsWith("|") && lines[i + 1]?.startsWith("|---")) {
    const header = split(line);
    let j = i + 2;
    for (; j < end && lines[j].startsWith("|"); j++) {
      let cells = split(lines[j]);
      let head = header;
      // C206 is a task row inside the pipelines table.
      if (cells[0] === "C206") head = ["ID", "Task", "Who", "Depends on", "When", "Done when", "Needs from Fin"];
      // B241-B245 (rounds, not pages) and C811-C812 (no single tool) leave out the second column.
      if ((section === "B2" || section === "C8") && cells.length === header.length - 1) cells.splice(1, 0, "");
      if (cells.length !== head.length) throw new Error(`${SPEC}:${j + 1}: ${cells.length} cells, the header has ${head.length}`);
      rows.push({ section, sectionTitle, line: j + 1, cells: Object.fromEntries(head.map((h, k) => [h, cells[k]])) });
      cells = [];
    }
    i = j - 1;
    continue;
  }
  if (line.startsWith("- ")) (bullets[section] ??= []).push(line.slice(2));
  else if (line.trim() && !line.startsWith("#")) (paragraphs[section] ??= []).push(line.trim());
}

const rowById = new Map(rows.map((r) => [r.cells.ID ?? r.cells["#"], r]));
const need = (id: string) => {
  const r = rowById.get(id);
  if (!r) throw new Error(`${SPEC}: no row ${id}`);
  return r;
};

// ── Weeks → due window and days ───────────────────────────────────────────
const week = (n: number): DueDays => ({ start: (n - 1) * 7 + 1, end: n * 7 });
function dueOf(when: string): { due: string; dueDays?: DueDays } {
  const w = plain(when);
  let m: RegExpExecArray | null;
  if (/^Done/.test(w)) return { due: w };
  if (/^Every week to M8$/.test(w)) return { due: "Every week to month 8", dueDays: { start: 1, end: 240 } };
  if (/^Monthly M2–M8$/.test(w)) return { due: "Monthly, months 2-8", dueDays: { start: 43, end: 240 } };
  if (/^M2[–-]M8$/.test(w)) return { due: "Months 2-8", dueDays: { start: 43, end: 240 } };
  if (/^M2\+$/.test(w)) return { due: "Month 2 on", dueDays: { start: 43, end: 240 } };
  if ((m = /^W(\d+) to launch$/.exec(w))) return { due: `Week ${m[1]} to launch`, dueDays: { start: week(+m[1]).start, end: 42 } };
  if ((m = /^W(\d+) to W(\d+)$/.exec(w))) return { due: `Weeks ${m[1]}-${m[2]}`, dueDays: { start: week(+m[1]).start, end: week(+m[2]).end } };
  if ((m = /^End W(\d+)$/.exec(w))) return { due: `End of week ${m[1]}`, dueDays: { start: week(+m[1]).end, end: week(+m[1]).end } };
  if ((m = /^W(\d+)\+$/.exec(w))) return { due: `Week ${m[1]} on`, dueDays: { start: week(+m[1]).start, end: 70 } };
  if ((m = /^After (\w+) \(W(\d+)\+\)$/.exec(w))) return { due: `After ${m[1]} (week ${m[2]} on)`, dueDays: { start: week(+m[2]).start, end: 70 } };
  if ((m = /^W(\d+) \(partners W(\d+)\)$/.exec(w))) return { due: `Week ${m[1]} (partners week ${m[2]})`, dueDays: week(+m[1]) };
  if ((m = /^W(\d+)( \(agreed day\))?$/.exec(w))) return { due: `Week ${m[1]}${m[2] ?? ""}`, dueDays: week(+m[1]) };
  if (w === "Launch") return { due: "Launch (week 6)", dueDays: week(6) };
  if (w === "Before launch") return { due: "Before launch", dueDays: { start: 29, end: 42 } };
  if (w === "Build") return { due: "Build (weeks 2-4)", dueDays: { start: 8, end: 28 } };
  if (w === "To W6") return { due: "Until launch (week 6)", dueDays: { start: 1, end: 42 } };
  if (w === "June 2027") return { due: "June 2027 (after month 8)", dueDays: { start: 240, end: 240 } };
  if (w === "Each round + launch") return { due: "Each round, and launch" };
  if (["Each round", "Always", "If needed", "As needed", "On exit", "End of engagement"].includes(w)) return { due: w };
  throw new Error(`Unknown "When": ${w}`);
}

function stageOf(days: DueDays | undefined, when: string, fallback: StageId): StageId {
  if (/End of engagement|On exit|June 2027/.test(when)) return "post-launch";
  if (!days) return fallback;
  if (days.end <= 14) return "onboarding";
  if (days.start <= 7 && days.end > 42) return "onboarding";
  if (days.start <= 28) return "build";
  if (days.start <= 35) return "testing";
  if (days.start <= 42) return "go-live";
  return "post-launch";
}

// ── Titles ─────────────────────────────────────────────────────────────────
function cut(text: string, max = 90): string {
  if (text.length <= max) return text;
  for (const sep of [" (", "; ", ": ", ". ", ", "]) {
    const at = text.indexOf(sep, 20);
    if (at !== -1 && at <= max) return text.slice(0, at);
  }
  return `${text.slice(0, text.lastIndexOf(" ", max - 1))}…`;
}
const pageName = (cell: string) => plain(cell).replace(/\s*\(.*\)\s*$/, "");

/** The title and the columns it was built from. */
function titleOf(r: Row): { title: string; used: string[] } {
  const c = r.cells;
  const s = r.section;
  const fin = (who: string | undefined, title: string) => (who && /^Fin( \(|$| decides$)/.test(who) && !/^Fin\b/.test(title) ? `Fin: ${title}` : title);
  if (s === "B2" && c["Page / item"]) return { title: `${pageName(c["Page / item"])}: ${cut(plain(c.Task))}`, used: ["Page / item", "Task"] };
  if (s === "B3") return { title: `Asset from ${plain(c.From)}: ${cut(plain(c.Asset))}`, used: ["Asset", "From"] };
  if (s === "B4") return { title: `Form: ${cut(plain(c.Form))}`, used: ["Form"] };
  if (s === "B8") return { title: `Test: ${cut(plain(c.Test))}`, used: ["Test"] };
  if (s === "C2" && c.Pipeline !== undefined) return { title: `Pipeline: ${cut(plain(c.Pipeline))}`, used: ["Pipeline"] };
  if (s === "C3") return { title: `Field: ${cut(plain(c.Field))}`, used: ["Field"] };
  if (s === "C8" && c.Integration) return { title: `${plain(c.Integration)}: ${cut(plain(c.Task))}`, used: ["Integration", "Task"] };
  if (s === "D") return { title: `Workflow: ${cut(plain(c.Workflow))}`, used: ["Workflow"] };
  if (s === "G") return { title: `Funnel: ${cut(plain(c.Item))}`, used: ["Item"] };
  return { title: fin(c.Who, cut(plain(c.Task))), used: ["Task"] };
}

// ── Notes ──────────────────────────────────────────────────────────────────
const LABEL: Record<string, string> = { Status: "Status on 17 Oct" };
function notesOf(id: string, r: Row, title: string, used: string[], extra: string[] = []): string {
  const out = [`From the spec: ${id} (3.${r.section} ${strip(r.sectionTitle)}).`];
  for (const key of used) if (!empty(r.cells[key]) && !title.includes(plain(r.cells[key]))) out.push(`${key}: ${strip(r.cells[key])}`);
  for (const [key, value] of Object.entries(r.cells)) {
    if (key === "ID" || key === "#" || used.includes(key) || empty(value)) continue;
    out.push(`${LABEL[key] ?? key}: ${strip(value)}`);
  }
  return [...out, ...extra].join("\n");
}

const CRM_NOTE = `Everything in 3.C is (draft) design until the audit (A14) and Fin's approval of the journey (A12).`;
const D_NOTE = `All 3.D workflows are (draft) designs to agree with Fin. DEFERRED: Fin said to ignore the automation side until the website and core GHL are done (WA 15 Oct). Global stop rules: D00.`;
const processLine = Object.values(paragraphs).flat().find((p) => p.startsWith("**For every sequence:**"));
if (!processLine) throw new Error(`${SPEC}: 3.E "For every sequence" line not found`);
const E_NOTE = `${strip(processLine)} Subjects and wording are (draft) purposes, not final copy.`;

// ── Build the tasks ────────────────────────────────────────────────────────
type Draft = Omit<TeamTask, "dependencies"> & { specId: string; dependsOn: string };
const drafts: Draft[] = [];
const taskId = (specId: string) => `bssc-${specId.toLowerCase().replace(/\./g, "-")}`;
const sectionLetter = (s: string) => s[0];

function add(specId: string, r: Row | null, fields: { title: string; notes: string; when: string; section: string; status: string; who?: string; dependsOn?: string }) {
  const { due, dueDays } = dueOf(fields.when);
  const step = PLACE[specId] ?? (specId.startsWith("E") ? `bssc-${MESSAGE_STEP[specId.split(".")[0]] ?? ""}` : undefined);
  const placedStep = step && stepStage.has(step) ? step : undefined;
  if (step && !placedStep) delete PLACE[specId];
  const fallback = SECTION_STAGE[fields.section] ?? SECTION_STAGE[sectionLetter(fields.section)] ?? "build";
  const stage = placedStep ? stepStage.get(placedStep)! : stageOf(dueDays, fields.when, fallback);
  const status = fields.status;
  const letter = sectionLetter(fields.section);
  let priority: TaskPriority = "normal";
  if (CRITICAL.has(specId)) priority = "critical";
  else if (/BLOCKED/.test(status)) priority = "high";
  else if (!["D", "E", "F"].includes(letter) && /^(OPTIONAL|DEFERRED|TODO \(later\))/.test(status)) priority = "low";
  const task: Draft = {
    id: taskId(specId),
    specId,
    title: TITLE[specId] ?? fields.title,
    stage,
    category: CATEGORY[fields.section] ?? CATEGORY[letter],
    role: ROLE,
    priority,
    due,
    notes: fields.notes,
    dependsOn: fields.dependsOn ?? "",
  };
  if (placedStep) task.step = placedStep;
  if (COMPLETES[specId]) task.completesWithSteps = COMPLETES[specId];
  if (dueDays) task.dueDays = dueDays;
  drafts.push(task);
  void r;
}

const scopeLines: string[] = [];
for (const r of rows) {
  const id = r.cells.ID ?? r.cells["#"];
  const letter = sectionLetter(r.section);
  if (letter === "K") continue; // into A22's notes
  if (letter === "H" || letter === "J" || OUT_OF_SCOPE.has(id)) {
    const text = Object.entries(r.cells).filter(([k, v]) => k !== "ID" && !empty(v)).map(([k, v]) => `${k}: ${strip(v)}`).join(" · ");
    scopeLines.push(`${id} (3.${r.section}): ${text}`);
    continue;
  }
  if (letter === "E") continue; // messages: below
  const { title, used } = titleOf(r);
  const extra: string[] = [];
  if (letter === "C") extra.push(CRM_NOTE);
  if (letter === "D") extra.push(D_NOTE);
  if (id === "A22") {
    const k = rows.filter((x) => x.section === "K").map((x) => `${x.cells["#"]} ${strip(x.cells.Commitment)} (${strip(x.cells["Where it was made"])}). ${strip(x.cells.Status)}`);
    extra.push(`Commitments outside the signed page, to put in writing in this addendum (3.K):\n${k.map((x) => `- ${x}`).join("\n")}`);
  }
  if (id === "D11") {
    const rule = rows.find((x) => x.section === "E8" && x.cells["#"] === "Rule");
    if (!rule) throw new Error(`${SPEC}: the E8 SMS rule is missing`);
    extra.push(`SMS limit (3.E8 rule): ${strip(rule.cells["Purpose (draft)"])}`);
  }
  const when = r.cells.When ?? WHEN_DEFAULT[id] ?? SECTION_WHEN[r.section];
  if (when === undefined) throw new Error(`${id}: no "When" and no default`);
  add(id, r, {
    title,
    notes: notesOf(id, r, title, used, extra),
    when,
    section: r.section,
    status: r.cells.Status ?? "",
    who: r.cells.Who,
    dependsOn: r.cells["Depends on"],
  });
}

// 3.C4 tags: one task per group.
const TAG_IDS: Record<string, string> = { Source: "C4-source", Status: "C4-status", Webinar: "C4-webinar", "Consent and safety": "C4-consent", Engagement: "C4-engagement", "Interest (from the import)": "C4-interest" };
for (const b of bullets.C4 ?? []) {
  const m = /^\*\*(.+?):\*\* (.+)$/.exec(b);
  if (!m || !TAG_IDS[m[1]]) throw new Error(`3.C4: unexpected line ${b}`);
  add(TAG_IDS[m[1]], null, {
    title: `Tags: ${m[1].replace(/ \(.+\)$/, "").toLowerCase()}`,
    notes: [`From the spec: 3.C4 Tags (draft), ${m[1]}.`, `Tags: ${m[2]}`, CRM_NOTE].join("\n"),
    when: SECTION_WHEN.C4,
    section: "C4",
    status: "",
  });
}

// D00: the global stop rules (3.D).
const stopRules = bullets.D ?? [];
if (stopRules.length !== 5) throw new Error(`3.D: expected 5 global stop rules, found ${stopRules.length}`);
add("D00", null, {
  title: "Build the global stop rules into every workflow",
  notes: [`From the spec: 3.D, "Global stop rules for every workflow".`, ...stopRules.map((x) => `- ${strip(x)}`), D_NOTE].join("\n"),
  when: "W5",
  section: "D",
  status: "",
});

// 3.E messages: one task per message.
const E_RANGES: Record<string, { n: string; timing?: string; purpose?: string }[]> = {
  "E6.7–E6.9": [{ n: "E6.7", timing: "Day 1 (draft)" }, { n: "E6.8", timing: "Day 6 (draft)" }, { n: "E6.9", timing: "Day 12 (draft)" }],
  "E8.3–E8.7": ["Build your setup", "Use it with confidence", "Protect yourself and your family", "Fund with confidence", "What to bring"].map((p, i) => ({ n: `E8.${3 + i}`, timing: "Daily before the webinar", purpose: `Value + reminder: ${p}` })),
  "E8.11–E8.14": ["+1 h", "+1 day", "+2 days", "+3 days"].map((t, i) => ({ n: `E8.${11 + i}`, timing: `Attended ${t}` })),
  "E8.15–E8.18": ["+1 h", "+1 day", "+2 days", "+3 days"].map((t, i) => ({ n: `E8.${15 + i}`, timing: `Missed ${t}` })),
  "E9.5+": [{ n: "E9.5" }],
};
const workflowOf = (title: string) => /\((D\d+)/.exec(title)?.[1];
for (const r of rows.filter((x) => sectionLetter(x.section) === "E")) {
  const raw = r.cells["#"];
  if (raw === "Rule") continue; // into D11's notes
  const wf = workflowOf(r.sectionTitle);
  const wfRow = wf ? need(wf) : null;
  const when = wfRow ? wfRow.cells.When : "W6";
  const wfStatus = wfRow ? wfRow.cells.Status : "";
  const items = E_RANGES[raw] ?? [{ n: raw }];
  items.forEach((item, k) => {
    const channel = plain(r.cells.Channel ?? "Email");
    const timing = item.timing ?? plain(r.cells.Timing ?? r.cells["Timing (draft)"]);
    const purpose = (item.purpose ?? plain(r.cells["Purpose (draft)"] ?? r.cells.Purpose)).replace(/^"(.+)"$/, "$1");
    const branch = r.cells.Branch ? `${plain(r.cells.Branch)} ` : "";
    const channelText = branch && !/^[A-Z]{2,}/.test(channel) ? channel.toLowerCase() : channel;
    const textN = raw === "E6.7–E6.9" ? ` ${k + 1} of 3` : "";
    const title = raw === "E6.7–E6.9"
      ? `SMS, ${timing.toLowerCase()}: nurture text${textN} (if consent)`
      : `${branch}${channelText}, ${timing.replace(/^(\w)/, (c) => c.toLowerCase())}: ${cut(purpose.replace(/: /g, ", "), 70)}`;
    const notes = [
      `From the spec: ${item.n}${raw !== item.n ? ` (row ${raw})` : ""} (3.${r.section} ${strip(r.sectionTitle)}).`,
      ...Object.entries(r.cells).filter(([key, v]) => key !== "#" && !empty(v)).map(([key, v]) => `${key}: ${strip(v)}`),
      ...(item.timing && raw !== "E6.7–E6.9" ? [`This message: ${item.timing}.`] : []),
      ...(item.purpose ? [`This message: ${item.purpose}.`] : []),
      ...(wfRow ? [`Workflow ${wf}, status on 17 Oct: ${strip(wfStatus)}`] : []),
      E_NOTE,
    ].join("\n");
    add(item.n, r, { title: `${title.charAt(0).toUpperCase()}${title.slice(1)}`, notes, when, section: r.section, status: wfStatus });
  });
}
// E12: internal alerts (a bullet line, not a table).
const alertLine = (bullets.E12 ?? [])[0] ?? "";
const alerts = [...alertLine.matchAll(/E12\.(\d) ([^·]+)/g)].map((m) => ({ n: `E12.${m[1]}`, what: m[2].trim() }));
if (alerts.length !== 6) throw new Error(`3.E12: expected 6 internal alerts, found ${alerts.length}`);
for (const a of alerts) {
  add(a.n, null, {
    title: `Internal alert: ${a.what}`,
    notes: [`From the spec: ${a.n} (3.E12 Internal alerts, not client-facing).`, `Alert: ${a.what}`].join("\n"),
    when: "W6",
    section: "E12",
    status: "",
  });
}

// Tasks the spec implies in section 4 (what Fin is shown), with no row in section 3.
add("X-launch-date", null, {
  title: "Propose a launch day to Fin",
  notes: [
    `From the spec: 4.4 approval 11 ("Launch day", shown a proposed date, week 5) and B607 ("Fin agrees the day"; rollback plan ready).`,
    `Fin's current site stays live until launch day (B608).`,
  ].join("\n"),
  when: "W5",
  section: "A",
  status: "",
});
add("X-onboarding-map", null, {
  title: `Draft the client onboarding map ("automated" vs "needs Fin")`,
  notes: `From the spec: 4.4 approval 9 (the client onboarding map, "automated" vs "needs you", step-by-step map, week 8), 4.5 call 5 (onboarding map session, week 8) and D10 ("steps per the onboarding map: each marked "automated" or "needs Fin"").`,
  when: "W8",
  section: "D",
  status: "",
});
add("X-scope", null, {
  title: "Not in scope: decide the Contact page, quote the rest if Fin asks",
  notes: [
    `From the spec: every item marked NOT IN SCOPE, plus 3.H (ads) and 3.J (add-ons, quoted separately). None is on this board. Open question 8: the Contact page (include, or quote?) is Jesse's call. Fin flagged its cost himself.`,
    ...scopeLines.map((x) => `- ${x}`),
  ].join("\n"),
  when: "As needed",
  section: "A",
  status: "",
});

// Dependencies: spec ids named in "Depends on" (ranges like F01–F09 expanded).
const bySpec = new Map(drafts.map((d) => [d.specId, d]));
function depsOf(d: Draft): string[] {
  const ids = new Set<string>();
  for (const m of d.dependsOn.matchAll(/\b([A-I])(\d{2,3})\s*[–-]\s*\1?(\d{2,3})\b/g)) {
    const width = m[2].length;
    for (let n = +m[2]; n <= +m[3]; n++) ids.add(`${m[1]}${String(n).padStart(width, "0")}`);
  }
  for (const m of d.dependsOn.matchAll(/\b([A-I]\d{2,3})\b/g)) ids.add(m[1]);
  return [...ids].filter((x) => x !== d.specId && bySpec.has(x)).map(taskId);
}

const tasks: TeamTask[] = drafts.map((d) => {
  const { specId, dependsOn, ...task } = d;
  void specId; void dependsOn;
  return { ...task, dependencies: depsOf(d) };
});

// ── Checks ─────────────────────────────────────────────────────────────────
const ids = new Set<string>();
for (const t of tasks) {
  if (ids.has(t.id)) throw new Error(`duplicate task id ${t.id}`);
  ids.add(t.id);
}
for (const id of Object.keys(PLACE)) if (!bySpec.has(id)) throw new Error(`PLACE names ${id}, which is not a task`);
for (const id of Object.keys(COMPLETES)) if (!bySpec.has(id)) throw new Error(`COMPLETES names ${id}, which is not a task`);
for (const { step } of bssCustomSteps) if (!tasks.some((t) => t.step === step.id)) throw new Error(`client step ${step.id} has no task behind it`);

// ── Write ──────────────────────────────────────────────────────────────────
function literal(task: TeamTask): string {
  const q = (v: unknown) => JSON.stringify(v);
  const out = [`    id: ${q(task.id)},`, `    title: ${q(task.title)},`, `    stage: ${q(task.stage)},`];
  if (task.step) out.push(`    step: ${q(task.step)},`);
  if (task.completesWithSteps) out.push(`    completesWithSteps: [${task.completesWithSteps.map(q).join(", ")}],`);
  out.push(`    category: ${q(task.category)},`, `    role: ${q(task.role)},`, `    priority: ${q(task.priority)},`, `    due: ${q(task.due)},`);
  if (task.dueDays) out.push(`    dueDays: { start: ${task.dueDays.start}, end: ${task.dueDays.end} },`);
  out.push(`    dependencies: [${task.dependencies.map(q).join(", ")}],`);
  out.push(`    notes: ${q(task.notes)},`);
  return `  {\n${out.join("\n")}\n  },`;
}
function body(list: TeamTask[]): string {
  const out: string[] = [];
  let category = "";
  for (const t of list) {
    if (t.category !== category) {
      category = t.category;
      out.push(`  // ── ${category} ──`);
    }
    out.push(literal(t));
  }
  return out.join("\n");
}
const file = `// BSS custom: the team side. One task per row of section 3 of the spec
// (products/bss-custom/spec.md), one per message in 3.E, plus the tasks section 4
// implies (ids bssc-x-…). Each sits behind the client step it supports, or is
// team-only in the stage its weeks fall in. The notes keep the spec's columns
// word for word, with each item's status on 17 Oct 2026.
//
// Generated once by scripts/products/import-bss-spec.ts on 2026-10-17.
// From here on this file is edited by hand: ask Claude. Bump the product
// version in index.ts with every change (npm run products:check enforces it).

import type { TeamTask } from "../types";

export const bssCustomTeamTasks: TeamTask[] = [
${body(tasks)}
];
`;

const byStep = new Map<string, number>();
for (const t of tasks) byStep.set(t.step ?? `(team-only, ${t.stage})`, (byStep.get(t.step ?? `(team-only, ${t.stage})`) ?? 0) + 1);
console.log(`${tasks.length} tasks; ${scopeLines.length} out-of-scope items listed in bssc-x-scope.`);
for (const [k, v] of byStep) console.log(`  ${k}: ${v}`);
if (process.argv.includes("--titles")) for (const t of tasks) console.log(`${t.id.padEnd(22)} ${t.stage.padEnd(11)} ${t.priority.padEnd(8)} ${t.due.padEnd(24)} ${t.title}`);
if (WRITE) {
  writeFileSync(join(ROOT, OUT), file);
  console.log(`Wrote ${OUT}.`);
} else {
  console.log(`Dry run. --write writes ${OUT}; --titles lists every task.`);
}
