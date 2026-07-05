# Publishing to Codex Sites

This project is built for OpenAI's Codex Sites hosting (`vinext` + `.openai/hosting.json` + Cloudflare D1). Publishing happens through whatever Codex UI/session manages this project — not through a CLI in this repo. This doc is the checklist for what needs to be true *before* and *after* you hit publish.

---

## Before you publish

### 1. Confirm the working tree is clean and pushed
```bash
git status
git log --oneline -5
```
Nothing uncommitted; latest commit is what you want live.

### 2. Check for pending migrations
```bash
ls drizzle/*.sql
```
As of this doc, migrations `0000`–`0004` exist. `0004_purple_hardball.sql` adds `portal_clients` and `portal_milestone_progress` — the tables the admin UI and client portal depend on.

**Open question (needs answering by you, since I can't see the Codex deploy pipeline):** does publishing to Codex Sites automatically run Drizzle migrations against the production D1 database, or is that a separate manual step? If you're not sure, the safest move is to publish once and then immediately check whether `/admin/clients` works in production — if it errors, migrations didn't run.

### 3. Know what data will and won't exist in production
- **Journey content** (stage names, milestones, day ranges) lives in code (`lib/onboardingJourney.ts`) — this ships automatically with the deploy, no action needed.
- **Client records** (`portal_clients`, `portal_milestone_progress`) live in the database — these do **NOT** ship with code. The Chris McBreen test record only exists in your local `.wrangler` dev database right now. Production starts with **zero clients**.

---

## After you publish

### 1. Verify the migrations landed
Visit `/admin/clients` on the production URL. If it loads (even with an empty list), the tables exist. If it 500s, migrations haven't run — ask Codex support or check the Codex deploy docs for how migrations get applied.

### 2. Create your first real client
Once `/admin/clients` works:
1. Fill in the client's real name, company, and actual start date
2. Click "Create client"
3. Click "Copy portal link" — that's the URL you send to the client

### 3. Smoke-test the real portal link
Open the copied link in an incognito window (so you see it exactly as the client would):
- Does the welcome video play?
- Does the journey show Day 1 (or whatever day matches the real start date)?
- Click into the current stage and confirm milestones render correctly

### 4. Bookmark `/admin/clients`
This is now your control panel for onboarding new clients going forward. No code changes needed to add a new client — just fill out the form.

---

## What does NOT need to happen again

- You do **not** need to re-run `npm run dev` locally to "activate" anything in production — local dev and production are separate D1 databases entirely.
- You do **not** need to manually copy the demo client's data over — `/portal/demo` is fully self-contained and doesn't touch the database at all, in dev or production.
- Editing journey content (`lib/onboardingJourney.ts`) is a code change — it needs a commit + a new publish to take effect, same as any other code change.

---

## If something looks wrong after publishing

| Symptom | Likely cause |
|---|---|
| `/admin/clients` shows a 500 error | Migrations didn't run — tables don't exist in production D1 |
| `/portal/[token]` 404s for a real client | Wrong token copied, or client wasn't actually created (check `/admin/clients` list) |
| Portal loads but "Day X" looks wrong | Start date was entered incorrectly when creating the client |
| Approving a milestone doesn't stick after reload | Check browser console for a failed `POST /api/portal/[token]/complete` — likely a production auth/binding issue worth flagging to me |
| `/portal/demo` looks different from before | This route is code-only — if it changed, something got published that shouldn't have; check `git log` |
