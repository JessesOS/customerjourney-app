// Where each environment deploys. Used by scripts/patch-wrangler.mjs and
// scripts/d1-migrate.mjs (Option D build, 2026-10-16).
//
// prod    — the live portal. Fin Creighton (a real client) uses it. Every
//           deploy needs Jesse's OK. Its workers.dev address is the clients'
//           link: NEVER put Cloudflare Access on it.
// staging — a private copy with its own database and file bucket, for testing
//           the team back office. Synthetic data only. Behind Cloudflare Access.

export const ENVS = {
  prod: {
    worker: "scale-onboarding-portal",
    d1Name: "scale-onboarding-portal-prod",
    d1Id: "e9ff232a-b1dc-41f4-b22e-d80551dc1f9b",
    r2Bucket: "scale-onboarding-portal-uploads",
    // The CSM_DASHBOARD service binding (BSS journey sync) was retired on
    // 2026-10-16 with the sync itself: the back office now lives in this app.
    services: [],
    // Team board live since 2026-10-18 (Jesse's OK). Sign-in is his access
    // code only, which counts as OWNER_EMAIL: no Cloudflare Access or
    // per-person logins yet (Jesse: he's the only team member). Autoseed stays
    // off until the Scale and Respond task lists are tidied.
    vars: {
      TEAM_BOARD: "1",
      OWNER_EMAIL: "jesse@allconvos.ai",
    },
    out: "dist/server/wrangler.json",
  },
  staging: {
    worker: "scale-onboarding-portal-staging",
    d1Name: "scale-onboarding-portal-staging",
    d1Id: "6fcd0c7a-39cc-4918-89fe-c9b1251615ed",
    r2Bucket: "scale-onboarding-portal-staging-uploads",
    services: [],
    vars: {
      TEAM_BOARD: "1",
      TEAM_BOARD_AUTOSEED: "1",
      // Draft products (products/<id> with status "draft") are offered in
      // admin and their boards start, so Jesse can preview a custom product
      // on synthetic clients. Prod leaves it unset: drafts never reach it.
      PRODUCT_DRAFTS: "1",
      PUBLIC_PORTAL_BASE: "https://scale-onboarding-portal-staging.jesse-b4e.workers.dev",
      // Filled in once the Cloudflare Zero Trust organisation and the staging
      // Access application exist (Phase 0.7 / 2.2).
      ACCESS_TEAM_DOMAIN: "",
      ACCESS_AUD: "",
      OWNER_EMAIL: "",
    },
    out: "dist/server/wrangler.staging.json",
  },
};

export function envFromArgs(argv = process.argv.slice(2)) {
  const i = argv.indexOf("--env");
  const name = i === -1 ? "prod" : argv[i + 1];
  if (!ENVS[name]) throw new Error(`Unknown --env "${name}". Use one of: ${Object.keys(ENVS).join(", ")}`);
  return { name, env: ENVS[name] };
}

/** Refuse any staging setting that points at a live resource. */
export function assertStagingIsolated() {
  const { prod, staging } = ENVS;
  const problems = [];
  if (!staging.worker.endsWith("-staging")) problems.push("staging worker name must end in -staging");
  if (staging.worker === prod.worker) problems.push("staging worker is the prod worker");
  if (staging.d1Id === prod.d1Id || staging.d1Name === prod.d1Name) problems.push("staging D1 is the prod D1");
  if (staging.r2Bucket === prod.r2Bucket) problems.push("staging R2 is the prod bucket");
  if (staging.out === prod.out) problems.push("staging must write its own config file");
  if (problems.length) throw new Error(`Staging is not isolated from prod: ${problems.join("; ")}`);
}
