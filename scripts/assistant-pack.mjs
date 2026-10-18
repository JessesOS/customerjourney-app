// Loads a client's reviewed knowledge pack for the "Ask Jesse" assistant.
// The assistant answers only from this pack (plus the client's live progress),
// so load only a pack Jesse has reviewed: no prices, GST, internal notes, other
// clients or RT Digital.
//
//   node scripts/assistant-pack.mjs --env staging --client <client id> --file <pack.md>
//   node scripts/assistant-pack.mjs --env prod --client <client id> --file <pack.md> --yes-prod
//   node scripts/assistant-pack.mjs --env local --client <client id> --file <pack.md>     (the worktree's local D1)
//   ... --show     print what is loaded now (first lines), change nothing
//
// The client id is the portal client's id (admin, or the team board's URL), never their link.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertStagingIsolated, envFromArgs } from "./deploy-envs.mjs";

const args = process.argv.slice(2);
const arg = (flag) => (args.indexOf(flag) === -1 ? null : args[args.indexOf(flag) + 1]);
const clientId = arg("--client");
const file = arg("--file");
const show = args.includes("--show");
const local = arg("--env") === "local";
if (!clientId || !/^[0-9a-f-]{36}$/.test(clientId)) throw new Error("Pass --client <client id> (a UUID from admin).");
if (!show && !file) throw new Error("Pass --file <pack.md>, or --show.");

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

function run(sql) {
  if (local) {
    const dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
    const db = readdirSync(dir).find((f) => f.endsWith(".sqlite") && f !== "metadata.sqlite");
    if (!db) throw new Error(`No local D1 in ${dir}. Start the dev server once first.`);
    return execFileSync("sqlite3", [join(dir, db)], { input: sql, encoding: "utf8" });
  }
  const { name, env } = envFromArgs(args);
  if (name === "staging") assertStagingIsolated();
  if (name === "prod" && !show && !args.includes("--yes-prod")) throw new Error("Refusing to change the live database without --yes-prod.");
  const tmp = mkdtempSync(join(tmpdir(), "assistant-pack-"));
  try {
    const path = join(tmp, "pack.sql");
    writeFileSync(path, sql);
    return execFileSync("npx", ["wrangler", "d1", "execute", env.d1Name, "--remote", "--yes", "--file", path], { encoding: "utf8" });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (show) {
  console.log(run(`SELECT client_id, updated_at, updated_by, length(content) AS chars, substr(content, 1, 400) AS start FROM portal_assistant_packs WHERE client_id = ${q(clientId)};`));
} else {
  const content = readFileSync(file, "utf8").trim();
  if (content.length < 200) throw new Error(`${file} looks too short to be a pack (${content.length} characters).`);
  if (/rt[\s_-]?digital/i.test(content)) throw new Error(`${file} mentions RT Digital. Remove it first: the client must never see it.`);
  const by = `assistant-pack.mjs (${file.split("/").pop()})`;
  run(
    `INSERT INTO portal_assistant_packs (client_id, content, updated_at, updated_by) VALUES (${q(clientId)}, ${q(content)}, ${q(new Date().toISOString())}, ${q(by)}) ` +
      `ON CONFLICT(client_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at, updated_by = excluded.updated_by;`,
  );
  console.log(`Loaded ${content.length} characters for client ${clientId} (${local ? "local" : arg("--env")}).`);
}
