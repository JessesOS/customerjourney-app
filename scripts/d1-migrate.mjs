// Applies SQL migrations to a remote D1 database, by environment.
//
//   node scripts/d1-migrate.mjs --env staging --file drizzle/0015_team_board.sql
//   node scripts/d1-migrate.mjs --env staging --all          (0000…latest in order; staging only)
//   node scripts/d1-migrate.mjs --env prod --file … --yes-prod
//
// Rules (Option D build, 2026-10-16):
// - prod needs --yes-prod, and runs one file at a time (Jesse approves each).
// - Any file that ALTERs or DROPs a portal_* table is refused: Fin's live
//   portal reads those tables, so schema changes must be additive (new tables).
// - Apply a prod migration BEFORE deploying the code that needs it.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { assertStagingIsolated, envFromArgs } from "./deploy-envs.mjs";

const args = process.argv.slice(2);
const { name, env } = envFromArgs(args);
if (name === "staging") assertStagingIsolated();

const fileArg = args.indexOf("--file") === -1 ? null : args[args.indexOf("--file") + 1];
const all = args.includes("--all");
if (!fileArg === !all) throw new Error("Pass exactly one of --file <path> or --all.");
if (name === "prod" && !args.includes("--yes-prod")) throw new Error("Refusing to touch the live database without --yes-prod.");
if (name === "prod" && all) throw new Error("--all is for bootstrapping staging only. Apply prod migrations one file at a time.");

const files = all
  ? readdirSync(new URL("../drizzle/", import.meta.url)).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort().map((f) => `drizzle/${f}`)
  : [fileArg];

const destructive = /\b(ALTER|DROP)\s+TABLE\s+(IF\s+EXISTS\s+)?[`"']?portal_/i;
for (const file of files) {
  const sql = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  // Bootstrapping a brand-new staging database from 0000 replays history,
  // which includes old ALTERs on portal_* tables. That's safe there (empty DB);
  // a single-file run must never do it.
  if (destructive.test(sql) && !(all && name === "staging")) {
    throw new Error(`${file} ALTERs or DROPs a portal_* table. Schema changes must be additive (new tables only).`);
  }
}

for (const file of files) {
  console.log(`→ ${env.d1Name} (${name}): ${file}`);
  execFileSync("npx", ["wrangler", "d1", "execute", env.d1Name, "--remote", "--yes", "--file", file], { stdio: "inherit" });
}
console.log(`Done: ${files.length} file(s) applied to ${env.d1Name}.`);
