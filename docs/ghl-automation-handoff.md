# GHL automation handoff (2026-08-03)

## Why this file exists

`project_context.md` covers the portal itself. This covers the **other half**: the GoHighLevel
side that creates a client's sub-account, generates their portal link, and delivers it to them.

That work lives in a different repo (`~/Master/Labs/stanley-henry-ai-brain`) because the
credentials do. Nothing in this repo can reach GHL. See "The credential boundary" below before
planning any automation work from a session rooted here.

Everything in the "verified" sections was re-checked live against GHL and the portal on
**2026-08-03**, not recalled from notes.

---

## What already works (verified 2026-08-03)

A full demo chain was built and fired on **2026-07-19**. Every artefact still stands:

| Piece | Identifier | State |
|---|---|---|
| Portal | `https://scale-onboarding-portal.jesse-b4e.workers.dev` | **200**, 9 clients |
| GHL custom field | `contact.onboarding_link`, id `I6gvzTG5hVisdCT6xpTa` | exists in RTD location, created 2026-07-19 08:40:34 |
| GHL workflow | "Jesse Onboard Demo", id `e88fd7ba-4b05-46f3-84de-aefa9144b6d8` | **published** |
| Demo contact | `Kwm1h2P3vfGQLcFVvV8a` (jesse@allconvos.ai) | tagged `jesse-onboard-demo`, added 2026-07-19 08:42:00 |
| Link written to contact | `/portal/LbRjAtQuuy2nITO_vUkcn4Oq` | **200**, still live |
| Demo sub-account | "1. Jesse Demo", `ZFZnrzadkRpJjypLaVhD` | live (the original `Rch1G21Kl0sElLMG3hsX` was deleted and recreated) |

RT Digital location id: `NJGocUVoS8R3rPaNX21j`. Agency company id: `2cULwuKKNXnGgiVUIzJo`.
Snapshot used for the demo sub-account: Convert Snapshot `wI6rD2x4SCfu8Wwmax18`.

---

## The chain, and which parts a machine can do

1. **Create portal client** via the admin API, get the link back. *Automatable.*
2. **Create the `onboarding_link` custom field** in GHL. *Automatable, already done once.*
3. **Build the workflow** (trigger: tag added, actions: SMS + email pulling
   `{{contact.onboarding_link}}`). *Automatable via the internal API only, see below.*
4. **Human approval pause** before any real send. *Deliberate, per the safety rules.*
5. **Upsert the contact with the tag**, workflow fires. *Automatable.*

**Publishing the workflow is manual and always will be.** GHL's public API v2 has no
workflow create or publish endpoint at all. Workflow building only works through the
**internal API**, which authenticates with a Firebase refresh token, and even that route
does not expose publish. Jesse clicks it in the UI. This is a platform limit, not an
unfinished piece of work.

---

## The credential boundary

**This repo holds no GHL credentials.** It has only `.env.example`. Confirmed 2026-08-03.

The keys live in `~/Master/Labs/stanley-henry-ai-brain/.env.local`:

- `GHL_AGENCY_PIT` — lists, reads and **creates** sub-accounts across all **58** locations
- `GHL_RTD_LOCATION_PIT` — RT Digital location: contacts read/write, workflows **read only**
- `SCALE_PORTAL_ADMIN_TOKEN` — full portal admin read/write

Plus `~/Master/Labs/leadgen-ghl-cli/accounts.json`, which holds per-client location keys.

**Two limits worth knowing before designing anything:**

- The agency PIT **cannot mint location tokens** for sub-accounts. Tested 2026-08-03:
  `POST /oauth/locationToken` returns **401, "The token is not authorized for this scope."**
  A Private Integration Token cannot do this; it needs an OAuth agency token. So agency-level
  access means list, read and create shells, **not** reach inside.
- Getting inside a sub-account needs a key saved for that specific location. **10 of 58**
  have one. Only **3** also have a Firebase refresh token (Doctor Damp, Strategize,
  RT Digital), and Firebase is what workflow building requires. **So workflows can only be
  automated in those 3 locations today.**

---

## Portal admin API (what the automation calls)

```
POST /api/admin/portal-clients
Header: x-admin-token: <SCALE_PORTAL_ADMIN_TOKEN>
Body:   { name, companyName, startDate, clientType, themeVariant }
```

Returns a token. Portal link is `https://scale-onboarding-portal.jesse-b4e.workers.dev/portal/<token>`.

- `clientType`: `meta-google` | `meta` | `google` | `respond`
- `themeVariant`: `warm` | `cool`

Live data as of 2026-08-03: 9 clients, only `google` and `meta-google` in use, both themes in
use, milestone counts 23 to 26 depending on type. Several are obvious test records
("t", "rich", "test2jesse") that Jesse deletes as he goes.

---

## Where this is going (Jesse's call, 2026-08-03)

- Jesse will **create the sub-account and apply the snapshot by hand**. Automating step 1
  is not the near-term goal.
- From there he wants **a sequence of automations connected to the customer journey**, which is
  the same thing `project_context.md` lists as outstanding item 4, "automation/notification
  wiring (post-MVP)".
- Portal and dashboard development continues in **this** repo. The GHL wiring happens back in
  the brain repo, where the keys are.

**The known gap:** everything built so far is demo-shaped. The trigger is the literal tag
`jesse-onboard-demo`, portal client creation is a hand-run API call, and nothing reads the
sold package to choose `clientType`. Turning this into something that runs on a real sale
means answering one question first: **what is the actual moment in GHL that means a deal
closed?** That is unresolved.

---

## Related

- Original session handoff:
  `~/Master/Labs/stanley-henry-ai-brain/reports/punch-lists/HANDOFF-onboarding-demo-2026-07-19.md`
- Workflow builder examples (internal API, Python):
  `~/Master/Labs/leadgen-ghl-cli/builders/`
