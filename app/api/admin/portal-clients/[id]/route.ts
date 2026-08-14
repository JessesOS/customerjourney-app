import { requestCanAdmin } from "@/lib/adminAuth";
import {
  deletePortalClient,
  isJourneyState,
  isPortalThemeVariant,
  setPortalClientTheme,
  updatePortalClientAdminFields,
} from "@/lib/portalClientStore";
import type { ClientType } from "@/lib/journeyEngine";

const validClientTypes: ClientType[] = ["meta", "google", "meta-google", "respond"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      themeVariant?: string;
      journeyState?: string;
      clientType?: string;
      clientTypeConfirmed?: boolean;
      /** Set by the brain's provisioning script so hand-run demo clients can be
          reached by the nudge worker, same as webhook-provisioned ones. */
      ghlContactId?: string;
      phone?: string;
      email?: string;
    };

    if (body.themeVariant !== undefined) {
      if (!isPortalThemeVariant(body.themeVariant)) {
        return Response.json({ ok: false, error: "Portal look must be handoff, warm, cool or neutral." }, { status: 400 });
      }
      await setPortalClientTheme(id, body.themeVariant);
    }

    const adminFields: Parameters<typeof updatePortalClientAdminFields>[1] = {};
    // Empty string explicitly UNLINKS (a client can be re-linked or corrected);
    // omitting the field leaves it untouched.
    if (typeof body.ghlContactId === "string") {
      adminFields.ghlContactId = body.ghlContactId.trim();
    }
    if (typeof body.phone === "string") adminFields.phone = body.phone.trim();
    if (typeof body.email === "string") adminFields.email = body.email.trim();
    if (body.journeyState !== undefined) {
      if (!isJourneyState(body.journeyState)) {
        return Response.json(
          { ok: false, error: "Journey state must be active, paused, completed or cancelled." },
          { status: 400 },
        );
      }
      adminFields.journeyState = body.journeyState;
    }
    if (body.clientType !== undefined) {
      if (!validClientTypes.includes(body.clientType as ClientType)) {
        return Response.json({ ok: false, error: "Client type must be meta, google, meta-google, or respond." }, { status: 400 });
      }
      adminFields.clientType = body.clientType as ClientType;
      // Explicitly choosing a type is what "confirming" means (Decision 2).
      adminFields.clientTypeConfirmed = true;
    }
    if (body.clientTypeConfirmed === true) {
      adminFields.clientTypeConfirmed = true;
    }
    if (Object.keys(adminFields).length > 0) {
      await updatePortalClientAdminFields(id, adminFields);
    }

    if (body.themeVariant === undefined && Object.keys(adminFields).length === 0) {
      return Response.json({ ok: false, error: "Nothing to update." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not update client." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!requestCanAdmin(request)) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deletePortalClient(id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Could not delete client." },
      { status: 500 },
    );
  }
}
