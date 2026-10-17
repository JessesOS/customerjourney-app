/**
 * Code boundaries: static import checks that keep the product files where they
 * belong (products:check, "code boundaries").
 *
 *   1. No "use client" module under app/ reaches, by value imports, the
 *      product files, the registry, the database or server-only modules. Team
 *      tasks (internal notes, staff names) must never be bundled for a browser.
 *   2. products/** imports only TYPES from lib/** (the one runtime direction is
 *      lib → products), and product folders never import ../index or ../load.
 *   3. The compat shims (lib/journeyEngine.ts, onboardingJourney.ts,
 *      stageGuide.ts, askAi.ts, stringPlans.ts) exist only for check:fin: no
 *      app code imports them, they hold no journey data, and journeyEngine
 *      exports exactly the 12 maps check:fin reads.
 *
 * Imports are read from source text: `import type`, `export type` and
 * all-`type` specifier lists are skipped; `@/`, `./` and `../` are resolved
 * with .ts, .tsx and index files. Packages are not followed.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as engine from "../../lib/journeyEngine";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** What a browser bundle must never reach. Paths are repo-relative; a trailing "/" means the whole folder. */
/** The compat shims: kept only because scripts/check-fin-journey.ts imports them. */
export const SHIMS = ["lib/journeyEngine.ts", "lib/onboardingJourney.ts", "lib/stageGuide.ts", "lib/askAi.ts", "lib/stringPlans.ts"];

export const CLIENT_FORBIDDEN = [
  "products/",
  "db/",
  "lib/productRegistry.ts",
  "lib/teamStore.ts",
  "lib/portalClientStore.ts",
  "lib/settings.ts",
  "lib/teamAuth.ts",
  ...SHIMS,
  "lib/allJourneys.ts",
];

/** The maps lib/journeyEngine.ts exports for check:fin, exactly. */
const ENGINE_MAPS = [
  "clientTypeLabels",
  "productBrandName",
  "productHiddenTaskBooking",
  "productHiddenTaskImportant",
  "productHiddenTaskPlayground",
  "productHiddenTaskVideos",
  "productHidesIncentive",
  "productIntroVideo",
  "productLockedLook",
  "productTagline",
  "productTaskDetails",
  "productTaskNotes",
];

type ImportRef = { spec: string; typeOnly: boolean };

const rel = (abs: string) => relative(ROOT, abs).split("\\").join("/");

/** Every import/export-from in a module, with whether it is erased (type-only). */
export function importsOf(source: string): ImportRef[] {
  const text = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  const refs: ImportRef[] = [];
  const fromRe = /(?:^|[\n;])\s*(import|export)\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  for (let m = fromRe.exec(text); m; m = fromRe.exec(text)) {
    const clause = m[2].trim();
    let typeOnly = /^type\b/.test(clause);
    if (!typeOnly) {
      const braces = /^\{([\s\S]*)\}$/.exec(clause);
      if (braces) {
        const specifiers = braces[1].split(",").map((x) => x.trim()).filter(Boolean);
        typeOnly = specifiers.length > 0 && specifiers.every((x) => /^type\s/.test(x));
      }
    }
    refs.push({ spec: m[3], typeOnly });
  }
  const bareRe = /(?:^|[\n;])\s*import\s+["']([^"']+)["']/g;
  for (let m = bareRe.exec(text); m; m = bareRe.exec(text)) refs.push({ spec: m[1], typeOnly: false });
  const dynamicRe = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
  for (let m = dynamicRe.exec(text); m; m = dynamicRe.exec(text)) refs.push({ spec: m[1], typeOnly: false });
  return refs;
}

/** A local import's file, or null for a package. */
export function resolveImport(fromFile: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith("./") || spec.startsWith("../")) base = resolve(dirname(fromFile), spec);
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

const isClientModule = (source: string) => /^(\s*(\/\/[^\n]*|\/\*[\s\S]*?\*\/))*\s*["']use client["']/.test(source);

const forbidden = (path: string, list: string[]) => list.find((f) => (f.endsWith("/") ? path.startsWith(f) : path === f));

/** Runs every boundary check. `clientForbidden` can be extended by later phases. */
export function codeBoundaries(clientForbidden: string[] = CLIENT_FORBIDDEN): { failures: string[]; summary: string } {
  const failures: string[] = [];
  const sources = new Map<string, string>();
  const read = (file: string) => {
    let s = sources.get(file);
    if (s === undefined) { s = readFileSync(file, "utf8"); sources.set(file, s); }
    return s;
  };

  // 1. Client modules never reach server-only code by value.
  const clientFiles = walk(join(ROOT, "app")).filter((f) => isClientModule(read(f)));
  let reached = 0;
  for (const entry of clientFiles) {
    const seen = new Set<string>([entry]);
    const queue: { file: string; trail: string[] }[] = [{ file: entry, trail: [rel(entry)] }];
    while (queue.length) {
      const { file, trail } = queue.shift()!;
      for (const ref of importsOf(read(file))) {
        if (ref.typeOnly) continue;
        const target = resolveImport(file, ref.spec);
        if (!target || seen.has(target)) continue;
        seen.add(target);
        const path = rel(target);
        const hit = forbidden(path, clientForbidden);
        if (hit) {
          failures.push(`"use client" ${trail[0]} reaches ${path}: ${[...trail, path].join(" → ")}`);
          continue;
        }
        queue.push({ file: target, trail: [...trail, path] });
      }
    }
    reached += seen.size;
  }

  // 2. products/** imports only types from lib/**; folders never import ../index or ../load.
  const productFiles = walk(join(ROOT, "products"));
  for (const file of productFiles) {
    const path = rel(file);
    const inFolder = path.split("/").length > 2;
    for (const ref of importsOf(read(file))) {
      const target = resolveImport(file, ref.spec);
      if (!target) continue;
      const to = rel(target);
      if (to.startsWith("lib/") && !ref.typeOnly) failures.push(`${path} imports ${to} at runtime: products/ may only import types from lib/`);
      if (inFolder && (to === "products/index.ts" || to === "products/load.ts")) failures.push(`${path} imports ${to}: a product folder must not import the product list`);
      if (path === "products/custom.ts" && !["products/types.ts", "products/helpers.ts"].includes(to) && !to.startsWith("lib/")) {
        failures.push(`products/custom.ts imports ${to}: it may only import ./types and ./helpers`);
      }
    }
  }

  // 3. Shims: no app code imports them; no journey data in them; journeyEngine's maps are exactly check:fin's.
  for (const file of walk(join(ROOT, "app"))) {
    for (const ref of importsOf(read(file))) {
      const target = resolveImport(file, ref.spec);
      if (target && SHIMS.includes(rel(target))) failures.push(`${rel(file)} imports the compat shim ${rel(target)}: read lib/productRegistry.ts or lib/journeyTypes.ts instead`);
    }
  }
  for (const shim of SHIMS) {
    const text = read(join(ROOT, shim));
    if (/\bid:\s*"|milestones:\s*\[/.test(text)) failures.push(`${shim} holds journey data: it belongs in products/`);
  }
  const engineMaps = Object.entries(engine)
    .filter(([name, value]) => (name.startsWith("product") || name === "clientTypeLabels") && value !== null && typeof value === "object")
    .map(([name]) => name)
    .sort();
  if (engineMaps.join(",") !== ENGINE_MAPS.join(",")) failures.push(`lib/journeyEngine.ts must export exactly the 12 maps check:fin reads (${ENGINE_MAPS.join(", ")}); it exports ${engineMaps.join(", ")}`);

  return {
    failures,
    summary: `${clientFiles.length} "use client" modules reach no server-only code or shim (${reached} imports walked); ${productFiles.length} product files import only types from lib/; ${SHIMS.length} shims hold no data and no app code imports them`,
  };
}
