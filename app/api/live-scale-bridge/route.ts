import { env } from "cloudflare:workers";
import {
  buildLiveBridgePayload,
  type BridgeClient,
  type BridgeTask,
} from "@/lib/liveScaleBridge";

function runtimeValue(key: string) {
  const runtime = env as Record<string, string | undefined>;
  return runtime[key] ?? process.env[key];
}

async function fetchBridgeJson<T>(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      "OAI-Sites-Authorization": `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Live scale bridge request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function GET() {
  try {
    const dashboardUrl =
      runtimeValue("LIVE_SCALE_DASHBOARD_URL") ??
      "https://respond-csm-dashboard.allconvos.chatgpt-team.site";
    const token = runtimeValue("LIVE_SCALE_DASHBOARD_TOKEN");
    const clientId =
      runtimeValue("LIVE_SCALE_CLIENT_ID") ?? "live-scale-chris-mcbreen";
    const environment = runtimeValue("LIVE_SCALE_ENVIRONMENT") ?? "live";
    const product = runtimeValue("LIVE_SCALE_PRODUCT") ?? "scale";

    if (!token) {
      return Response.json(
        {
          ok: false,
          error:
            "LIVE_SCALE_DASHBOARD_TOKEN is missing. Add the live Respond dashboard bypass token before using the bridge.",
        },
        { status: 503 }
      );
    }

    const clientsUrl = `${dashboardUrl}/api/clients?environment=${encodeURIComponent(environment)}&product=${encodeURIComponent(product)}`;
    const tasksUrl = `${dashboardUrl}/api/tasks?environment=${encodeURIComponent(environment)}&product=${encodeURIComponent(product)}&clientId=${encodeURIComponent(clientId)}`;

    const clientsPayload = await fetchBridgeJson<{ clients: BridgeClient[] }>(
      clientsUrl,
      token
    );
    const client = clientsPayload.clients.find((entry) => entry.id === clientId);

    if (!client) {
      return Response.json(
        {
          ok: false,
          error: `Could not find live Scale client ${clientId}.`,
          clients: clientsPayload.clients.map((entry) => ({
            id: entry.id,
            name: entry.name,
            companyName: entry.companyName,
          })),
        },
        { status: 404 }
      );
    }

    const tasksPayload = await fetchBridgeJson<{ tasks: BridgeTask[] }>(
      tasksUrl,
      token
    );
    const bridge = buildLiveBridgePayload(client, tasksPayload.tasks, dashboardUrl);

    return Response.json({
      ok: true,
      bridge,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live scale bridge failed.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
