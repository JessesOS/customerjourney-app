import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

const fileEnv = readEnvFile(path.join(cwd, ".env.local"));
const env = { ...fileEnv, ...process.env };

function required(key) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.json();
}

async function main() {
  const sourceUrl = required("LIVE_SCALE_DASHBOARD_URL").replace(/\/$/, "");
  const sourceToken = required("LIVE_SCALE_DASHBOARD_TOKEN");
  const clientId = required("LIVE_SCALE_CLIENT_ID");
  const environment = env.LIVE_SCALE_ENVIRONMENT ?? "live";
  const product = env.LIVE_SCALE_PRODUCT ?? "scale";

  const targetUrl = required("CURATED_DASHBOARD_URL").replace(/\/$/, "");
  const targetBypassToken = required("CURATED_DASHBOARD_BYPASS_TOKEN");
  const syncToken = required("LIVE_SCALE_SYNC_TOKEN");

  const clientPayload = await fetchJson(
    `${sourceUrl}/api/clients?environment=${encodeURIComponent(environment)}&product=${encodeURIComponent(product)}`,
    {
      headers: {
        "OAI-Sites-Authorization": `Bearer ${sourceToken}`,
      },
    },
  );

  const client = clientPayload.clients?.find((entry) => entry.id === clientId);
  if (!client) {
    throw new Error(`Could not find live client ${clientId} in the source dashboard.`);
  }

  const tasksPayload = await fetchJson(
    `${sourceUrl}/api/tasks?environment=${encodeURIComponent(environment)}&product=${encodeURIComponent(product)}&clientId=${encodeURIComponent(clientId)}`,
    {
      headers: {
        "OAI-Sites-Authorization": `Bearer ${sourceToken}`,
      },
    },
  );

  const result = await fetchJson(`${targetUrl}/api/live-scale-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OAI-Sites-Authorization": `Bearer ${targetBypassToken}`,
      "x-live-scale-sync-token": syncToken,
    },
    body: JSON.stringify({
      client,
      tasks: tasksPayload.tasks ?? [],
      dashboardUrl: sourceUrl,
      sourceClientId: clientId,
      lastSyncMessage: `Curated sync imported locally from ${client.name} at ${new Date().toISOString()}.`,
    }),
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
