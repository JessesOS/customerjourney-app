import { requestCanAdminAsync } from "@/lib/teamAuth";
import { autoStartBoard } from "@/lib/teamStore";
import { createPortalClient, isPortalThemeVariant, listPortalClients } from "@/lib/portalClientStore";
import { acceptedClientTypes, clientTypeOptions, DEFAULT_CLIENT_TYPE, isAcceptedClientType, lockedLookFor } from "@/lib/productRegistry";

// Which client types exist, are offered and are accepted comes from the
// product files (lib/productRegistry.ts): live and paused types are accepted,
// only live ones are offered for new clients.

export async function GET(request: Request) {
  if (!(await requestCanAdminAsync(request))) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const clients = await listPortalClients();
    return Response.json({ ok: true, clients, clientTypeOptions: clientTypeOptions({ drafts: false }), defaultClientType: DEFAULT_CLIENT_TYPE });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not load clients." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await requestCanAdminAsync(request))) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { name?: string; companyName?: string; startDate?: string; clientType?: string; themeVariant?: string };
    const name = body.name?.trim();
    const companyName = body.companyName?.trim() ?? "";
    const startDate = body.startDate?.trim();
    const clientType = body.clientType?.trim() ?? DEFAULT_CLIENT_TYPE;
    // A product with a fixed look stores that look, so the admin shows what the client sees.
    const lockedLook = isAcceptedClientType(clientType, { drafts: false }) ? lockedLookFor(clientType) : undefined;
    const themeVariant = lockedLook ?? body.themeVariant?.trim() ?? "grove";

    if (!name) {
      return Response.json({ ok: false, error: "Client name is required." }, { status: 400 });
    }
    if (!startDate || Number.isNaN(new Date(startDate).getTime())) {
      return Response.json({ ok: false, error: "A valid start date is required." }, { status: 400 });
    }
    if (!isAcceptedClientType(clientType, { drafts: false })) {
      return Response.json({ ok: false, error: `Client type must be one of: ${acceptedClientTypes({ drafts: false }).join(", ")}.` }, { status: 400 });
    }
    if (!isPortalThemeVariant(themeVariant)) {
      return Response.json({ ok: false, error: "Portal look is not one of the available looks." }, { status: 400 });
    }

    const created = await createPortalClient({ name, companyName, startDate, clientType, themeVariant });
    // Staging (and, after go-live, prod): start the team board straight away.
    const teamBoard = await autoStartBoard(created.id, "created in admin");
    return Response.json({ ok: true, ...created, teamBoard });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not create client." },
      { status: 500 },
    );
  }
}
