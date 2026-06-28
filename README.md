# McBreen Project Portal

This project is a Sites-hosted client strategy portal with a Google Drive-backed
knowledge library for the AI project chat.

## Client Library Rollout

Use this setup pattern for future client portals.

### Default architecture

- Reuse one RT Digital Google Cloud service account across clients.
- Give each client their own Google Drive folder as the knowledge library.
- Share that client folder with the service account email as `Viewer`.
- Point the portal to that folder's Drive ID.
- Reuse the same `GOOGLE_SERVICE_ACCOUNT_JSON` secret unless RTD rotates it.

This means most new clients do **not** need a new Google Cloud project or a new
JSON key.

### Required runtime variables

- `GOOGLE_DRIVE_FOLDER_ID`: the target client folder ID
- `GOOGLE_SERVICE_ACCOUNT_JSON`: the RTD service account JSON key

### Standard rollout steps

1. Create or choose the client's Google Drive folder.
2. Share the folder with the RTD service account email as `Viewer`.
3. Add or update `GOOGLE_DRIVE_FOLDER_ID` in Sites for that client portal.
4. Ensure `GOOGLE_SERVICE_ACCOUNT_JSON` is present in Sites as a secret.
5. Deploy the site so the new environment revision is active.
6. Run `Refresh Library` or call `/api/knowledge-sync`.
7. Confirm `/api/knowledge-status` shows `provider: google-drive`.
8. Test one meeting query and one contract/pricing query.

### What to expect after a healthy sync

- `provider: google-drive`
- indexed source count increases beyond the seeded fallback library
- contract PDFs appear as indexed when PDF extraction succeeds
- chat answers pull from live client documents instead of bundled fallback notes

### Current RTD service account

- Service account email:
  `codex-drive-sync@next-electrical--1757991613260.iam.gserviceaccount.com`

### Current McBreen folder

- Google Drive folder ID:
  `12mOtyTf-tvChnZ_Uk2HIHoYWVU2p-Jer`

### Troubleshooting

- If the chat says it is using the seeded library, check env vars first.
- If sync succeeds but contract PDFs fail, inspect PDF worker packaging.
- If answers drift to the wrong source, verify the live sync completed and then
  inspect retrieval rules in `app/api/project-chat/route.ts`.

# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
