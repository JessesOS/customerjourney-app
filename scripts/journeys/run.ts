/**
 * Runs the frozen-journey checks (npm run check:journeys), writes and dumps
 * fixtures. Used by scripts/check-journeys.ts and by products:check.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { CLIENT_TYPES, canonical, firstDiff, hashOf, plain, type GlobalContract, type JourneyContract, type Producer } from "./contract";
import { legacyProducer } from "./legacy-producer";
import { registryProducer } from "./registry-producer";
import { portalMarkup, welcomeMarkup } from "./ssr";

/** The implementations that must each reproduce the fixtures. The first one writes them. */
export const PRODUCERS: Producer[] = [legacyProducer, registryProducer];

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FIXTURE_DIR = join(ROOT, "scripts", "fixtures", "journeys");
const FIN_FIXTURE = join(ROOT, "scripts", "fixtures", "fin-bss-meta-journey.json");
const GLOBAL = "_global";
/** Renders kept in full in each fixture, so a reader can see what a hash stands for. */
const RENDER_SAMPLES = ["none@day1", "all@day30"];

export type StoredData = Omit<JourneyContract, "renders"> & { renders: Record<string, string>; renderSamples: Record<string, unknown> };
export type Fixture = { data: StoredData; ssr: Record<string, string>; welcome: Record<string, string> };

const mapValues = <T, U>(record: Record<string, T>, fn: (v: T) => U): Record<string, U> =>
  Object.fromEntries(Object.entries(record).map(([k, v]) => [k, fn(v)]));

const fixturePath = (name: string) => join(FIXTURE_DIR, `${name}.json`);
const toFile = (value: unknown) => JSON.stringify(canonical(value), null, 2) + "\n";

/** A contract as a fixture stores it: renders hashed, two kept in full. */
export function storedData(contract: JourneyContract): StoredData {
  const { renders, ...rest } = contract;
  return plain({
    ...rest,
    renders: mapValues(renders, hashOf),
    renderSamples: Object.fromEntries(RENDER_SAMPLES.map((k) => [k, renders[k]])),
  });
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function typeFixturesPresent(): string[] {
  if (!existsSync(FIXTURE_DIR)) return [];
  return readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith(".json") && f !== `${GLOBAL}.json`)
    .map((f) => f.replace(/\.json$/, ""));
}

export type CheckCounts = { renders: number; markup: number };

/** Every check. Returns the failures (empty = PASS); `counts` receives what was compared. */
export function runJourneyChecks(counts: CheckCounts = { renders: 0, markup: 0 }): string[] {
  const failures: string[] = [];
  let renders = 0;
  let markup = 0;
  const present = typeFixturesPresent();
  for (const ct of CLIENT_TYPES) if (!present.includes(ct)) failures.push(`${ct}: no frozen fixture at scripts/fixtures/journeys/${ct}.json`);
  for (const extra of present.filter((p) => !(CLIENT_TYPES as readonly string[]).includes(p))) failures.push(`${extra}.json is not one of the frozen client types`);

  for (const ct of CLIENT_TYPES) {
    if (!present.includes(ct)) continue;
    const fixture = readJson<Fixture>(fixturePath(ct));
    renders += Object.keys(fixture.data.renders).length;

    for (const producer of PRODUCERS) {
      let now: StoredData;
      try {
        now = storedData(producer.contract(ct));
      } catch (error) {
        failures.push(`${ct} [${producer.name}]: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      // Renders: by hash, naming each differing key.
      const keys = [...new Set([...Object.keys(now.renders), ...Object.keys(fixture.data.renders)])];
      const differing = keys.filter((k) => now.renders[k] !== fixture.data.renders[k]);
      if (differing.length) {
        failures.push(`${ct} [${producer.name}]: ${differing.length} stage render(s) differ: ${differing.slice(0, 8).join(", ")}${differing.length > 8 ? " …" : ""}`);
      }
      const { renders: _a, ...restNow } = now;
      const { renders: _b, ...restFrozen } = fixture.data;
      const diff = firstDiff(restNow, restFrozen);
      if (diff) failures.push(`${ct} [${producer.name}]: ${diff}`);
    }

    // Server-rendered markup (one implementation: the components themselves).
    const ssr = mapValues(portalMarkup(ct, fixture.data.visibleIds), hashOf);
    const welcome = mapValues(welcomeMarkup(ct), hashOf);
    markup += Object.keys(fixture.ssr).length + Object.keys(fixture.welcome).length;
    for (const [label, nowHashes, frozen] of [["markup", ssr, fixture.ssr], ["welcome", welcome, fixture.welcome]] as const) {
      const keys = [...new Set([...Object.keys(nowHashes), ...Object.keys(frozen)])];
      const differing = keys.filter((k) => nowHashes[k] !== frozen[k]);
      if (differing.length) failures.push(`${ct}: ${differing.length} ${label} render(s) differ: ${differing.slice(0, 8).join(", ")}${differing.length > 8 ? " …" : ""}`);
    }
  }

  // Global: accepted types, admin options, step ids, forms, GHL mapping, media, roles.
  if (!existsSync(fixturePath(GLOBAL))) {
    failures.push(`no frozen fixture at scripts/fixtures/journeys/${GLOBAL}.json`);
  } else {
    const frozen = readJson<GlobalContract>(fixturePath(GLOBAL));
    for (const producer of PRODUCERS) {
      const diff = firstDiff(plain(producer.global()), frozen);
      if (diff) failures.push(`${GLOBAL} [${producer.name}]: ${diff}`);
    }
  }

  failures.push(...crossCheckFin());
  counts.renders = renders;
  counts.markup = markup;
  return failures;
}

/**
 * The bss-meta fixture must agree with Fin's own baseline (check:fin), so the
 * two guards can never drift apart.
 */
export function crossCheckFin(): string[] {
  const failures: string[] = [];
  const must = (ok: unknown, message: string) => { if (!ok) failures.push(`bss-meta vs check:fin baseline: ${message}`); };
  if (!existsSync(fixturePath("bss-meta"))) return [`bss-meta vs check:fin baseline: no bss-meta fixture`];
  type Fin = {
    journeyTemplate: unknown; visibleIds: unknown; stageGuides: unknown; askItems: unknown; stringPlan: unknown;
    journeyTotalDays: number; renders: Record<string, unknown>; productMaps: Record<string, unknown>;
  };
  const fin = readJson<Fin>(FIN_FIXTURE);
  const data = readJson<Fixture>(fixturePath("bss-meta")).data;

  for (const key of ["journeyTemplate", "visibleIds", "stageGuides", "askItems", "stringPlan"] as const) {
    const diff = firstDiff(data[key], fin[key]);
    must(!diff, `${key} differs: ${diff}`);
  }
  must(fin.journeyTotalDays === data.totalDays, `journeyTotalDays ${fin.journeyTotalDays} ≠ totalDays ${data.totalDays}`);
  let shared = 0;
  for (const [k, stages] of Object.entries(fin.renders)) {
    if (!(k in data.renders)) continue;
    shared++;
    must(hashOf(stages) === data.renders[k], `render ${k} differs`);
  }
  must(shared > 0, "no shared render keys");

  const maps = fin.productMaps;
  const expectedMaps = [
    "clientTypeLabels", "productBrandName", "productHiddenTaskBooking", "productHiddenTaskImportant", "productHiddenTaskPlayground",
    "productHiddenTaskVideos", "productHidesIncentive", "productIntroVideo", "productLockedLook", "productTagline", "productTaskDetails", "productTaskNotes",
  ];
  must(isDeepStrictEqual(Object.keys(maps).sort(), expectedMaps), `productMaps has keys ${Object.keys(maps).sort().join(", ")}`);
  must(maps.productLockedLook === data.lockedLook, `lockedLook ${String(maps.productLockedLook)} ≠ ${String(data.lockedLook)}`);
  must(maps.productBrandName === data.brandName, `brandName ${String(maps.productBrandName)} ≠ ${String(data.brandName)}`);
  must(maps.productHidesIncentive === (data.hidesIncentive || null), `hidesIncentive ${String(maps.productHidesIncentive)} ≠ ${String(data.hidesIncentive)}`);
  must(isDeepStrictEqual(maps.productIntroVideo, data.introVideo), "introVideo differs");
  must(maps.productTagline === data.tagline, `tagline ${String(maps.productTagline)} ≠ ${String(data.tagline)}`);
  for (const [id, note] of Object.entries((maps.productTaskNotes ?? {}) as Record<string, string>)) must(data.steps[id]?.note === note, `note on ${id} differs`);
  for (const [id, detail] of Object.entries((maps.productTaskDetails ?? {}) as Record<string, string>)) must(data.steps[id]?.detail === detail, `detail of ${id} differs`);
  for (const id of (maps.productHiddenTaskVideos ?? []) as string[]) must(data.steps[id]?.showsVideo === false, `${id} shows its video`);
  for (const id of (maps.productHiddenTaskBooking ?? []) as string[]) must(data.steps[id]?.showsBooking === false, `${id} shows its booking calendar`);
  for (const id of (maps.productHiddenTaskImportant ?? []) as string[]) must(data.steps[id]?.showsImportant === false, `${id} shows its Important box`);
  for (const id of (maps.productHiddenTaskPlayground ?? []) as string[]) must(data.steps[id]?.showsPlayground === false, `${id} shows the playground`);
  must(maps.clientTypeLabels === data.label, `label ${String(maps.clientTypeLabels)} ≠ ${String(data.label)}`);
  return failures;
}

/** Writes the fixtures for these client types (and `_global`) from the first producer. */
export function writeFixtures(types: string[], options: { yesFin: boolean }): string[] {
  const producer = PRODUCERS[0];
  mkdirSync(FIXTURE_DIR, { recursive: true });
  const written: string[] = [];
  for (const ct of types) {
    if (ct === GLOBAL) {
      writeFileSync(fixturePath(GLOBAL), toFile(producer.global()));
      written.push(GLOBAL);
      continue;
    }
    if (!(CLIENT_TYPES as readonly string[]).includes(ct)) throw new Error(`${ct} is not one of the frozen client types (${CLIENT_TYPES.join(", ")})`);
    if (ct === "bss-meta" && !options.yesFin) throw new Error("bss-meta is Fin's live journey: add --yes-fin, and only for a change Jesse approved");
    const contract = producer.contract(ct);
    const fixture: Fixture = {
      data: storedData(contract),
      ssr: mapValues(portalMarkup(ct, contract.visibleIds), hashOf),
      welcome: mapValues(welcomeMarkup(ct), hashOf),
    };
    writeFileSync(fixturePath(ct), toFile(fixture));
    written.push(ct);
  }
  return written;
}

/** Full contracts (renders in full) and every markup render as HTML, for diffing two commits. */
export function dumpAll(dir: string): void {
  for (const producer of PRODUCERS) {
    const base = join(dir, "contracts", producer.name);
    mkdirSync(base, { recursive: true });
    for (const ct of CLIENT_TYPES) writeFileSync(join(base, `${ct}.json`), toFile(producer.contract(ct)));
    writeFileSync(join(base, `${GLOBAL}.json`), toFile(producer.global()));
  }
  const fileName = (key: string) => key.replace(/\|/g, "_");
  for (const ct of CLIENT_TYPES) {
    const visibleIds = existsSync(fixturePath(ct)) ? readJson<Fixture>(fixturePath(ct)).data.visibleIds : PRODUCERS[0].contract(ct).visibleIds;
    const ssrDir = join(dir, "ssr", ct);
    mkdirSync(ssrDir, { recursive: true });
    for (const [key, html] of Object.entries(portalMarkup(ct, visibleIds))) writeFileSync(join(ssrDir, `${fileName(key)}.html`), html);
    const welcomeDir = join(dir, "welcome", ct);
    mkdirSync(welcomeDir, { recursive: true });
    for (const [name, html] of Object.entries(welcomeMarkup(ct))) writeFileSync(join(welcomeDir, `${name}.html`), html);
  }
}
