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

## What calls this endpoint (the GHL half — NOT this session's lane)

Per the session coordination block at the top of `customer-journey-master-plan.md`:
GHL reads, writes, workflow building and UI driving happen **only from the brain
session**, and the GHL half of Phase 3 is an **open decision owned by Jesse**. The
three LaunchBay subscription-activated workflows are **parked, untouched** — the
"repoint" language in the plan's Phase 3 predates the 2026-08-06 scope narrowing.
The leading option is a new minimal workflow (trigger: subscription activated, one
step: POST here), built as a draft from the brain session, published by Jesse.

What the caller must supply, whatever it ends up being: the JSON contract above,
the `x-portal-hook-secret` header, and an `eventId` unique per fire (e.g.
`{{contact.id}}-{{order.id}}`). Cross-lane needs go into the master plan doc, not
into either session's backlog.

Not done yet, deliberately: the outbox/welcome flow (Phase 4), and the custom domain
(Decision 4 — the portal link still lands in spam from `workers.dev`; do the domain
before real clients get links automatically). Note the webhook path creates **no GHL
sub-account** (this repo holds no GHL key by design) — where sub-account creation
lives on a real sale is an open design question tracked in the coordination block.
