// Patches the build-generated dist/server/wrangler.json before deploy.
// vinext emits placeholder values on every build; deploying unpatched sends
// the app to the wrong worker name with a zeroed D1 id. Run via:
//   node scripts/patch-wrangler.mjs   (after npm run build, before wrangler deploy)
import { readFileSync, writeFileSync } from "node:fs";

// Flip to true once R2 is enabled on the Cloudflare account and the bucket
// exists (npx wrangler r2 bucket create scale-onboarding-portal-uploads).
// While false the binding is stripped so deploys don't fail on the missing
// bucket — the app then stores uploads inline in D1, exactly as before R2.
const R2_READY = false;

const path = new URL("../dist/server/wrangler.json", import.meta.url);
const cfg = JSON.parse(readFileSync(path, "utf8"));

cfg.name = "scale-onboarding-portal";
for (const binding of cfg.d1_databases ?? []) {
  binding.database_id = "e9ff232a-b1dc-41f4-b22e-d80551dc1f9b"; // scale-onboarding-portal-prod
}
if (R2_READY) {
  for (const binding of cfg.r2_buckets ?? []) {
    binding.bucket_name = "scale-onboarding-portal-uploads";
  }
} else {
  delete cfg.r2_buckets;
}

writeFileSync(path, JSON.stringify(cfg, null, 2));
console.log(`patched dist/server/wrangler.json: ${cfg.name} (r2: ${R2_READY ? "on" : "stripped"})`);
