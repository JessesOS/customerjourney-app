/**
 * Frozen journeys: proof that no client type's portal has changed.
 *
 * For every client type (meta, google, meta-google, bss-meta, respond, bss and
 * an unknown stored type), scripts/fixtures/journeys/<type>.json freezes what
 * the portal is built from and shows: steps and wording, every stage render,
 * days, branding, per-step tweaks, voice guides, Ask-AI, String Theory, admin
 * counts and labels, and the portal's server-rendered markup in every look.
 * _global.json freezes the cross-product lists (accepted types, admin options,
 * step ids, forms, GHL mapping, media, team roles). The bss-meta fixture is
 * also cross-checked against Fin's own baseline (check:fin).
 *
 *   npm run check:journeys                          check (exit 1 on any difference)
 *   npm run check:journeys -- --dump <dir>          write full contracts and markup, to diff two commits
 *   npm run check:journeys -- --write <type…>       re-save (only for a change Jesse approved; bss-meta needs --yes-fin,
 *                                                   and so does _global when Fin's forms, uploads or video in it change)
 *   npm run check:journeys -- --write-all           first freeze only (refused once any fixture exists)
 *
 * Added 2026-10-17 (Option D, Phase 3), before the portal moved to products/.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CLIENT_TYPES } from "./journeys/contract";
import { dumpAll, runJourneyChecks, typeFixturesPresent, writeFixtures, type CheckCounts } from "./journeys/run";

const args = process.argv.slice(2);
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  try {
    if (args.includes("--dump")) {
      const dir = args[args.indexOf("--dump") + 1];
      if (!dir || dir.startsWith("--")) throw new Error("--dump needs a directory");
      dumpAll(resolve(dir));
      console.log(`Dumped full contracts and markup → ${resolve(dir)}`);
    } else if (args.includes("--write-all")) {
      const present = typeFixturesPresent();
      if (present.length) throw new Error(`fixtures already exist (${present.join(", ")}). Re-save one type at a time with --write <type>, and only for a change Jesse approved.`);
      const written = writeFixtures([...CLIENT_TYPES, "_global"], { yesFin: true });
      console.log(`Froze ${written.length} fixtures: ${written.join(", ")}`);
    } else if (args.includes("--write")) {
      const types = args.slice(args.indexOf("--write") + 1).filter((a) => !a.startsWith("--"));
      if (!types.length) throw new Error("--write needs one or more client types (or _global)");
      const yesFin = args.includes("--yes-fin");
      if (types.includes("bss-meta") && !yesFin) throw new Error("bss-meta is Fin's live journey: re-saving it needs --yes-fin, and only for a change Jesse approved");
      for (const t of types) console.log(`Re-saving frozen journey for ${t}: only for a change Jesse approved`);
      const written = writeFixtures(types, { yesFin });
      console.log(`Wrote ${written.join(", ")}`);
    } else {
      const counts: CheckCounts = { renders: 0, markup: 0 };
      const failures = runJourneyChecks(counts);
      if (failures.length) {
        console.error(`FAIL check:journeys (${failures.length} problem${failures.length === 1 ? "" : "s"}):`);
        for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
        if (failures.length > 40) console.error(`  … and ${failures.length - 40} more`);
        console.error("Inspect with: npm run check:journeys -- --dump <dir> (here and at the previous commit), then diff -r.");
        process.exit(1);
      }
      console.log(`PASS check:journeys (${CLIENT_TYPES.length} client types, ${counts.renders} renders, ${counts.markup} markup renders)`);
    }
  } catch (error) {
    console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
