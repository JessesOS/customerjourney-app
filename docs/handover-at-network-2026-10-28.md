# Handover: AT Network portal (28 Oct 2026)

For a fresh session rooted at `~/Master/AI/customerjourney-app`. Everything else is in the repo and memory; read `CLAUDE.md`, `docs/new-client-product-playbook.md` and `docs/at-network-communications-plan.md`.

## Where it stands
- **AT Network is live on prod** (`at-network`, "Rich & Ben", client id `829e70fb-931e-402b-af1b-e6ca47c5976b`, start 2026-10-26, Grove Aurora). Board started (40 tasks at go-live). Agreement **Version 2 of 26 Oct** is in the portal word for word; Rich's signature (27 Oct, 3:39 pm Sydney) is recorded, so step 1 shows done. His portal link is **unopened**: https://scale-onboarding-portal.jesse-b4e.workers.dev/portal/LLB2VlG7GjBFzR_kfzKeZPM8 . Never open it in a normal browser.
- **Prod worker:** version 95c3ab18 (signing page). Email alerts live through Resend (`portal@allconvos.ai`, sender name "Launchpad"; key set on prod and staging).
- **The "Signed and on our way" email** went to Rich, Martyn (both addresses), Ben and Fiona on 27 Oct. `fi@awaretrepreneur.global` does not exist; Fiona is `fiona@awaretrepreneur.global`.
- **Waiting on:** Ben's bank transfer for payment 1 (ATN-2610-P1). When it lands: mark it paid outside Stripe, send Rich his portal link, he books the kickoff from the portal.
- **On branch `at-network` and staging, NOT on prod:** the Foundations VSL (this handover's last commit). Needs Jesse's OK and a deploy package. It adds: "Your Foundations VSL" (a simple tick, in place of the 2-minute impact cut), "Send the original files of Martyn's overview", "Send footage of your networking calls", "Send your locked edit of the Foundations VSL" (their editor assembles and locks the edit; Jesse does the finishing; the one round covers the finishing only), "Review your Foundations VSL: one round", plus board tasks and a Scope and Map item. Source: `~/Master/Side_Projects/Clients/atnetwork/notes/2026-10-28-portal-add-foundations-vsl.md`. The agreement is not changed.

## Open
- Jesse's call: the Home line on the Scope and Map still says "a two-minute cut of your impact video" (the signed text); the VSL item says it replaces it.
- The AT note says "Rich and Ben need logins". Decision on 25 Oct: no logins, one shared link. Ask if that has changed.
- Welcome video mp4 (to go in `portal.introVideo`, in R2 on both buckets). Rich's 28 Oct voice note is untranscribed.
- Later builds: link the old Vercel agreements page (AT only; new clients use Launchpad's signing page); a Communications tab; per-person logins; the phone and text agent (phase 3 idea in the comms plan).

## How things work (all in the playbook and memory)
- New client: add in prod admin, Start board, copy the **Signing link** from the board's Agreement section and send it first, then the portal link. Memory note `new-client-signing-process`.
- Every prod deploy needs Jesse's explicit OK as a package: commits, checks, live version, D1 bookmark, rollback command. Checks before any commit or deploy: `tsc`, `products:check`, `check:journeys`, `check:fin`, `check:team-auth`.
- After a staging deploy, wait ~20 seconds before creating a demo client: a client created straight away can be served by an older copy of the worker (its board then has old tasks).
- No logins by design. Fin's portal and fixtures must never change without Jesse's OK.
