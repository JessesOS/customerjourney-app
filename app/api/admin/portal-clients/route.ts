import { requestCanAdmin } from "@/lib/adminAuth";
import { createPortalClient, listPortalClients } from "@/lib/portalClientStore";
import type { ClientType } from "@/lib/journeyEngine";

const validClientTypes: ClientType[] = ["meta", "google", "meta-google", "respond"];

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
    if (!validClientTypes.includes(clientType as ClientType)) {
      return Response.json({ ok: false, error: "Client type must be meta, google, meta-google, or respond." }, { status: 400 });
    }

    const created = await createPortalClient({ name, companyName, startDate, clientType: clientType as ClientType });
    return Response.json({ ok: true, ...created });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not create client." },
      { status: 500 },
    );
  }
}
