# Handover to the CSM dashboard session: 2026-10-15

From the portal design session (`~/Master/AI/customerjourney-app`, branch `motion-redesign`).
Paste this into the CSM Dashboard session (`~/Master/AI/csm-dashboard`).

## What changed in the portal that the CSM side needs to know

1. **New product: `bss`, shown as "BSS Fin Creighton".** A custom product for the first signed client,
   Fin Creighton, Bitcoin Success School. For now it runs the Scale journey exactly as a Meta-only
   client sees it: same task ids (`ob-…`, `bd-1/2/3`, `ts-…`, `gl-…`, `pl-…`), Google-only tasks
   hidden. Defined in `lib/journeyEngine.ts` (`ClientType`, `clientTypeLabels`,
   `milestoneVisibleFor`). Admin lets you create a client with it; the client's `client_type` column
   holds `bss`.
2. **New first task on both products: the voice interview.** `ob-0` on Scale (and so on BSS), and
   `rsp-000` on the second product. Onboarding is now 11 tasks on Scale/BSS and 6 on the second
   product. Existing clients will show it open.
3. **The interview's answer is a conversation.** It is saved as the task's note through the existing
   completion endpoint, as lines of "Interviewer: …" and "Client: …". Notes can now be up to 12,000
   characters (was 2,000).
4. **The second product is now displayed as "CRM".** Its stored value is still `respond`; only labels
   changed.
5. **Portal looks.** Any of nine looks can be set per client (`theme_variant`): grove (default for new
   clients), groveaurora, handoff, cobalt, aurora, calm, warm, cool, neutral.

## What the CSM side probably needs to do

- Recognise `client_type = "bss"`: label it "BSS Fin Creighton" and treat it as Scale with Meta only
  when listing its tasks.
- Re-run the importer so `ob-0` and `rsp-000` exist on the CSM side.
- Show the `ob-0` / `rsp-000` note (the interview transcript) to the team, with line breaks kept.
- Rename the second product's label to "CRM" if the dashboard shows it.

## Added later the same day

- The BSS product's look is fixed by the product: the Aurora welcome, then Grove Aurora with the journey
  rail (`productLockedLook` in `lib/journeyEngine.ts`). A BSS client record is stored with
  `theme_variant = "groveaurora"`, and the admin's look picker is locked for it.
- The client's surname is spelled Creighton (corrected from Crichton).
- Opening a task now puts `?task=<id>` in the portal's address, so browser Back and Forward move between
  the journey page and a task. Links of the form `/portal/<token>?task=<id>` open that task directly.

## Update: the portal now runs your 41-task BSS journey (deployed)

- `lib/bssJourney.ts` holds the BSS journey: **your ids `bss-001` … `bss-041`, your five stages**, from
  your `lib/bssTasks.ts`. A task ticked in the portal is the same task on your board.
- **Jesse's call: Fin sees all 41 tasks for now** (not only the portal-visible ones). Each has Fin-facing
  wording written from the agreement (a first draft for Jesse to check).
- **Client tasks** (Fin acts): `bss-001` intake interview, `bss-003` share access, `bss-004` agree the
  customer journey, `bss-014` / `bss-015` / `bss-016` review website, webinar and partner pages,
  `bss-027` confirm launch day. Their notes carry Fin's comments.
- **Team tasks** (the other 34) are flagged `awaitingTeam`: Fin sees them as "With us" and can't tick them.
  The team ticks them in the portal admin (new checklist per client, `POST
  /api/admin/portal-clients/<id>/milestones` with `{ milestoneId, done }`).
- `bss-001` is the voice interview; its transcript is the note on `bss-001`.
- Journey length for BSS is 240 days (weeks 1–10 plus support to month 8).
- If the CSM board becomes where the team ticks tasks, a sync from the CSM to the portal's completions
  (or the reverse) is the next piece; nothing syncs yet.

## Not decided yet

- Whether BSS gets its own task list (it would need its own task ids, e.g. `bss-…`, and the CSM
  importer would need to know them).
- Whether webhook-provisioned clients can arrive as `bss`. Today only the admin can create one;
  `lib/productMapping.ts` (GHL product codes) was not touched.
