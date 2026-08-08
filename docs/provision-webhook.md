# Provisioning webhook: `/api/hooks/ghl/provision`

Built and live 2026-08-08 (master plan Phases 2 + 3). A GHL workflow fires this on a
sale; the portal creates the client record, stores the GHL identity, and returns the
portal link. Every fire — success or failure — posts to Jesse's Slack DM.

## The contract

```
POST https://scale-onboarding-portal.jesse-b4e.workers.dev/api/hooks/ghl/provision
Header: x-portal-hook-secret: <PORTAL_HOOK_SECRET>     (or ?secret= if headers are awkward)
Content-Type: application/json

{
  "eventId":     "required — idempotency key, unique per fire (use the GHL execution/order id)",
  "contactId":   "required — GHL contact id",
  "productName": "required — drives the journey mapping",
  "locationId":  "the client's new sub-account id",
  "opportunityId": "...",
  "email": "...", "phone": "...",
  "firstName": "...", "lastName": "...", "companyName": "...",
  "orderId": "...", "amount": 330, "currency": "AUD"
}
```

Responses:

- **200** `{ ok, clientId, portalToken, portalLink, clientType, clientTypeConfirmed }` — created.
- **200** `{ replayed: true, ... }` — same `eventId` seen before; original outcome returned, nothing new created.
- **200** `{ duplicateContact: true, ... }` — this contact already has a portal client; its existing link returned (failure mode F2).
- **422** — product has no journey mapping. **This is a stop, not a guess** (F6): Slack is notified, no client is created. Fix `lib/productMapping.ts`, redeploy, then re-fire or let GHL retry — the same `eventId` will reprocess after an error.
- **401** wrong secret · **400** missing fields · **503** secret not configured · **500** unexpected (GHL should retry; all paths are retry-safe).

## Product mapping (lib/productMapping.ts)

| Product name contains | Journey | Confirmed? |
|---|---|---|
| `Respond` (word) | `respond` | yes |
| `Scale` (word) | `meta-google` | **no — flagged "unconfirmed" in /admin/clients** until a human confirms the ad-channel split (Decision 2) |
| anything else (incl. Convert — no portal journey template exists) | none | fails loud to Slack, 422 |

Client start date is today in **Australia/Brisbane** (sub-account timezones are unreliable, verified 2026-08-06).

## Dry run (the synthetic decay guard)

`"dryRun": true` in the body validates the secret, payload and mapping, writes
nothing, notifies nothing:

```bash
curl -s -X POST "$BASE/api/hooks/ghl/provision" \
  -H "content-type: application/json" -H "x-portal-hook-secret: $PORTAL_HOOK_SECRET" \
  -d '{"eventId":"synthetic","contactId":"synthetic","productName":"Respond - Full Price [ Trial & Sub ]","dryRun":true}'
# → {"ok":true,"dryRun":true,"mapped":true,"productCode":"respond",...}
```

Provisioning fires ~monthly, so schedule this monthly from the brain to catch decay.

## Where the pieces live

- **Secret**: Worker secret `PORTAL_HOOK_SECRET` (rotate with `npx wrangler secret put`);
  the same value is in the brain repo's `.env.local` for the GHL workflow config and tests.
- **Slack**: Worker secret `PORTAL_SLACK_WEBHOOK` (same webhook as the brain's notify path).
- **Idempotency log**: `portal_webhook_log` table — one row per `eventId` ever received.
- **Identity columns**: `portal_clients.ghl_contact_id` (unique) `.ghl_location_id`
  `.ghl_opportunity_id` `.email` `.phone` `.product_code` `.source_order_id`
  `.provisioned_at` `.go_live_at` `.journey_state` `.client_type_confirmed`.
- **Admin PATCH** (`/api/admin/portal-clients/[id]`) now also accepts `journeyState`
  (`active|paused|completed|cancelled`, Decision 5), `clientType` (confirms it), and
  `clientTypeConfirmed: true`.

## GHL side (the half that lives in the brain / GHL session)

Per the master plan, repoint **one** product line first — Respond. In the GHL workflow
(e.g. `Subscription Activated -> Trigger LaunchBay Zap (Respond)`, id
`cf62da7d-b8ac-4b3c-9e8e-fa63e7d14553`):

1. Replace the dead LaunchBay webhook step with a **Custom Webhook** action, POST,
   URL above, header `x-portal-hook-secret: <PORTAL_HOOK_SECRET>`.
2. Map the body fields from the trigger's contact/payment context. `eventId` must be
   unique per fire — the workflow execution id or `{{contact.id}}-{{order.id}}`.
3. **Rename the workflow** (it's named after a tool nobody uses).
4. Ship as draft → Jesse publishes (platform limit and safety rule agree) → test fire
   → check the Slack DM and /admin/clients.

Not done yet, deliberately: the GHL workflow repoint itself, the outbox/welcome flow
(Phase 4), and the custom domain (Decision 4 — the portal link still lands in spam
from `workers.dev`; do the domain before real clients get links automatically).
