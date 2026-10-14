# Handover to the CSM dashboard session: 2026-10-15

From the portal design session (`~/Master/AI/customerjourney-app`, branch `motion-redesign`).
Paste this into the CSM Dashboard session (`~/Master/AI/csm-dashboard`).

## What changed in the portal that the CSM side needs to know

1. **New product: `bss`, shown as "BSS Fin Crichton".** A custom product for the first signed client,
   Fin Crichton, Bitcoin Success School. For now it runs the Scale journey exactly as a Meta-only
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

- Recognise `client_type = "bss"`: label it "BSS Fin Crichton" and treat it as Scale with Meta only
  when listing its tasks.
- Re-run the importer so `ob-0` and `rsp-000` exist on the CSM side.
- Show the `ob-0` / `rsp-000` note (the interview transcript) to the team, with line breaks kept.
- Rename the second product's label to "CRM" if the dashboard shows it.

## Not decided yet

- Whether BSS gets its own task list (it would need its own task ids, e.g. `bss-…`, and the CSM
  importer would need to know them).
- Whether webhook-provisioned clients can arrive as `bss`. Today only the admin can create one;
  `lib/productMapping.ts` (GHL product codes) was not touched.
