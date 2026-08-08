// Patches the build-generated dist/server/wrangler.json before deploy.
// vinext emits placeholder values on every build; deploying unpatched sends
// the app to the wrong worker name with a zeroed D1 id. Run via:
//   node scripts/patch-wrangler.mjs   (after npm run build, before wrangler deploy)
import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../dist/server/wrangler.json", import.meta.url);
const cfg = JSON.parse(readFileSync(path, "utf8"));

cfg.name = "scale-onboarding-portal";
for (const binding of cfg.d1_databases ?? []) {
  binding.database_id = "e9ff232a-b1dc-41f4-b22e-d80551dc1f9b"; // scale-onboarding-portal-prod
}

writeFileSync(path, JSON.stringify(cfg, null, 2));
console.log("patched dist/server/wrangler.json:", cfg.name);
