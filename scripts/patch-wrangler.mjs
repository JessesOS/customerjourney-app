// Patches the build-generated dist/server/wrangler.json before deploy.
// vinext emits placeholder values on every build; deploying unpatched sends
// the app to the wrong worker name with a zeroed D1 id. Run after
// `npm run build`, before `wrangler deploy`:
//
//   node scripts/patch-wrangler.mjs                 prod  → dist/server/wrangler.json
//   node scripts/patch-wrangler.mjs --env staging   staging → dist/server/wrangler.staging.json
//
// Staging writes its own file, never the prod one, so a staging patch can't be
// deployed to the live worker by a bare `wrangler deploy`. Deploy staging with
//   npx wrangler deploy --config dist/server/wrangler.staging.json
// Environments live in scripts/deploy-envs.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { ENVS, assertStagingIsolated, envFromArgs } from "./deploy-envs.mjs";

// Flip to true once R2 is enabled on the Cloudflare account and the bucket
// exists. While false the binding is stripped so deploys don't fail on the
// missing bucket — the app then stores uploads inline in D1, exactly as before R2.
const R2_READY = true; // R2 enabled + bucket created 2026-08-09

const { name, env } = envFromArgs();
if (name === "staging") assertStagingIsolated();

const source = new URL("../dist/server/wrangler.json", import.meta.url);
const cfg = JSON.parse(readFileSync(source, "utf8"));

// Prod must never pick up a staging value, even if dist/ was patched for
// staging before (staging writes elsewhere, so the source stays clean).
if (name === "prod" && (cfg.name === ENVS.staging.worker || JSON.stringify(cfg).includes(ENVS.staging.d1Id))) {
  throw new Error("dist/server/wrangler.json holds staging values. Rebuild (npm run build) before patching prod.");
}

cfg.name = env.worker;
for (const binding of cfg.d1_databases ?? []) {
  binding.database_id = env.d1Id;
  if (name !== "prod") binding.database_name = env.d1Name;
}
if (R2_READY) {
  for (const binding of cfg.r2_buckets ?? []) {
    binding.bucket_name = env.r2Bucket;
  }
} else {
  delete cfg.r2_buckets;
}

const bindings = new Set(env.services.map((s) => s.binding));
cfg.services = [...(cfg.services ?? []).filter((s) => !bindings.has(s.binding) && s.binding !== "CSM_DASHBOARD"), ...env.services];

if (Object.keys(env.vars).length) cfg.vars = { ...(cfg.vars ?? {}), ...env.vars };

const out = new URL(`../${env.out}`, import.meta.url);
writeFileSync(out, JSON.stringify(cfg, null, 2));
const services = env.services.map((s) => s.binding).join(", ") || "none";
console.log(`patched ${env.out}: ${cfg.name} (r2: ${R2_READY ? "on" : "stripped"}, service: ${services})`);
