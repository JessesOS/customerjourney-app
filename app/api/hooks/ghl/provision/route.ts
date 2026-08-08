import { notifyHook } from "@/lib/hookNotify";
import { mapProductToJourney } from "@/lib/productMapping";
import {
  getPortalClientByGhlContactId,
  getPortalClientById,
  getWebhookEvent,
  provisionPortalClient,
  recordWebhookEvent,
} from "@/lib/portalClientStore";

/**
 * Inbound provisioning webhook (master plan §5.2, Phase 3).
 *
 * A GHL workflow fires this on payment / subscription activation. The portal
 * creates the client record, stores the GHL identity, and returns the portal
 * link. Idempotent three ways: a replayed eventId returns the original
 * outcome; a contact that already has a portal client never gets a second one
 * (F2); client + idempotency rows are written in one atomic batch.
 *
 * Auth is a shared secret (Worker secret PORTAL_HOOK_SECRET) in the
 * x-portal-hook-secret header, or ?secret= for senders that can't set
 * headers. The portal never holds a GHL key (Decision 1).
 */

type ProvisionBody = {
  eventId?: string;
  contactId?: string;
  locationId?: string;
  opportunityId?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  productName?: string;
  orderId?: string;
  amount?: string | number;
  currency?: string;
  dryRun?: boolean;
};

function asTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Today's date for the client's journey clock. Sub-account timezones are
 * unreliable (verified 2026-08-06), so RT Digital's own timezone is the clock. */
function todayInBrisbane(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane" }).format(new Date());
}

function portalLinkFor(request: Request, portalToken: string): string {
  return `${new URL(request.url).origin}/portal/${portalToken}`;
}

export async function POST(request: Request) {
  const configured = process.env.PORTAL_HOOK_SECRET;
  if (!configured) {
    // Never fall open: an unset secret disables the endpoint entirely.
    console.error("PORTAL_HOOK_SECRET is not set — provision endpoint is disabled.");
    return Response.json({ ok: false, error: "Provisioning is not configured." }, { status: 503 });
  }

  const presented =
    request.headers.get("x-portal-hook-secret") ?? new URL(request.url).searchParams.get("secret");
  if (presented !== configured) {
    return Response.json({ ok: false, error: "Forbidden" }, { status: 401 });
  }

  let body: ProvisionBody;
  try {
    body = (await request.json()) as ProvisionBody;
  } catch {
    return Response.json({ ok: false, error: "Body must be JSON." }, { status: 400 });
  }

  const eventId = asTrimmed(body.eventId);
  const contactId = asTrimmed(body.contactId);
  const productName = asTrimmed(body.productName);

  const missing = [
    !eventId && "eventId",
    !contactId && "contactId",
    !productName && "productName",
  ].filter(Boolean);
  if (missing.length > 0) {
    return Response.json({ ok: false, error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }

  const firstName = asTrimmed(body.firstName);
  const lastName = asTrimmed(body.lastName);
  const companyName = asTrimmed(body.companyName);
  const email = asTrimmed(body.email) || null;
  const phone = asTrimmed(body.phone) || null;
  const clientName = [firstName, lastName].filter(Boolean).join(" ") || companyName || email || contactId;
  const mapped = mapProductToJourney(productName);

  // Dry run: validate secret, payload and mapping, write nothing, notify
  // nothing. This is what the synthetic decay-guard test will call.
  if (body.dryRun === true) {
    return Response.json({
      ok: true,
      dryRun: true,
      mapped: mapped !== null,
      ...(mapped ?? {}),
      clientName,
      startDate: todayInBrisbane(),
    });
  }

  try {
    // Replay of an eventId we've already resolved: return the original outcome.
    const priorEvent = await getWebhookEvent(eventId);
    if (priorEvent && priorEvent.clientId && !priorEvent.result.startsWith("error")) {
      const client = await getPortalClientById(priorEvent.clientId);
      if (client) {
        return Response.json({
          ok: true,
          replayed: true,
          clientId: client.id,
          portalToken: client.portalToken,
          portalLink: portalLinkFor(request, client.portalToken),
        });
      }
    }
    // A prior error result (e.g. unmapped product, since fixed) is reprocessed.

    if (!mapped) {
      // F6: an unmapped product is a stop, not a guess.
      await recordWebhookEvent(eventId, "error:unmapped-product", null, body);
      const notified = await notifyHook(
        `:rotating_light: Portal provisioning STOPPED — product "${productName}" has no journey mapping.\n` +
          `Contact ${contactId} (${clientName}) paid and got NO portal. eventId ${eventId}.\n` +
          `Fix the mapping in lib/productMapping.ts (or handle this sale by hand), then let GHL retry or re-fire the webhook.`,
      );
      return Response.json(
        { ok: false, error: `No journey mapping for product "${productName}".`, notified },
        { status: 422 },
      );
    }

    // F2: one portal client per GHL contact, ever.
    const existing = await getPortalClientByGhlContactId(contactId);
    if (existing) {
      await recordWebhookEvent(eventId, "duplicate-contact", existing.id, body);
      const link = portalLinkFor(request, existing.portalToken);
      const notified = await notifyHook(
        `:warning: Portal provisioning: contact ${contactId} (${clientName}) already has a portal client ` +
          `("${existing.name}", created ${existing.createdAt.slice(0, 10)}). No new client created. ` +
          `New eventId ${eventId}, product "${productName}". Existing link: ${link}`,
      );
      return Response.json({
        ok: true,
        duplicateContact: true,
        clientId: existing.id,
        portalToken: existing.portalToken,
        portalLink: link,
        notified,
      });
    }

    const created = await provisionPortalClient({
      eventId,
      payload: body,
      name: clientName,
      companyName,
      startDate: todayInBrisbane(),
      clientType: mapped.clientType,
      clientTypeConfirmed: mapped.clientTypeConfirmed,
      ghlContactId: contactId,
      ghlLocationId: asTrimmed(body.locationId) || null,
      ghlOpportunityId: asTrimmed(body.opportunityId) || null,
      email,
      phone,
      productCode: mapped.productCode,
      sourceOrderId: asTrimmed(body.orderId) || null,
    });

    const portalLink = portalLinkFor(request, created.portalToken);
    const confirmNote = mapped.clientTypeConfirmed
      ? ""
      : `\nJourney defaulted to *${mapped.clientType}* (product name doesn't carry the ad-channel split) — confirm it in /admin/clients.`;
    const notified = await notifyHook(
      `:tada: Portal client provisioned automatically: *${clientName}*${companyName ? ` (${companyName})` : ""}\n` +
        `Product "${productName}" → ${mapped.productCode} journey. ${portalLink}${confirmNote}`,
    );

    return Response.json({
      ok: true,
      clientId: created.id,
      portalToken: created.portalToken,
      portalLink,
      clientType: mapped.clientType,
      clientTypeConfirmed: mapped.clientTypeConfirmed,
      notified,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Provision webhook failed:", error);
    await notifyHook(
      `:rotating_light: Portal provisioning FAILED for eventId ${eventId}, contact ${contactId} (${clientName}): ${message}`,
    );
    // 5xx so GHL retries; every path above is idempotent under retry.
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
