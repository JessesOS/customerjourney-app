import { isAdminEmail, isAdminToken, isLocalDevelopmentHost } from "@/lib/adminAuth";
import { createPortalClient, listPortalClients } from "@/lib/portalClientStore";

function requestCanAdmin(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (isAdminEmail(email)) return true;

  const host = request.headers.get("host");
  if (isLocalDevelopmentHost(host)) return true;

  const token = new URL(request.url).searchParams.get("token") ?? request.headers.get("x-admin-token");
  if (isAdminToken(token)) return true;

  return false;
}

export async function GET(request: Request) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const clients = await listPortalClients();
    return Response.json({ ok: true, clients });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load clients." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { name?: string; companyName?: string; startDate?: string; clientType?: string };
    const name = body.name?.trim();
    const companyName = body.companyName?.trim() ?? "";
    const startDate = body.startDate?.trim();
    const clientType = body.clientType?.trim() ?? "meta-google";

    if (!name) {
      return Response.json({ ok: false, error: "Client name is required." }, { status: 400 });
    }
    if (!startDate || Number.isNaN(new Date(startDate).getTime())) {
      return Response.json({ ok: false, error: "A valid start date is required." }, { status: 400 });
    }
    if (!["meta", "google", "meta-google"].includes(clientType)) {
      return Response.json({ ok: false, error: "Client type must be meta, google, or meta-google." }, { status: 400 });
    }

    const created = await createPortalClient({ name, companyName, startDate, clientType: clientType as "meta" | "google" | "meta-google" });
    return Response.json({ ok: true, ...created });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not create client." },
      { status: 500 },
    );
  }
}
