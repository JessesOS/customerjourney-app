# Getting into the portal admin

The admin (`/admin/clients`) is where you create clients, read their answers and interview transcripts,
and tick off the team's tasks. It is locked so only the team can open it.

**Live admin:** https://scale-onboarding-portal.jesse-b4e.workers.dev/admin/clients

## How the lock works

- There is one **access code** for the whole team, stored as a secret on Cloudflare
  (`ADMIN_ACCESS_TOKEN` on the `scale-onboarding-portal` worker).
- A browser is unlocked **once**: paste the code into the lock screen, or open an **invite link**
  (the admin address with the code built in). The browser remembers it after that.
- Clearing the browser's data, a private window, or a new device means unlocking again.
- `localhost` (your Mac's local copy) is never locked.
- The code can't be read back from Cloudflare. If it's lost, you set a new one.

## Day to day

1. Open the live admin link above in the browser you normally use.
2. If it opens straight onto the client list, you're in. Nothing else to do.

## A new device or browser (your phone, a laptop)

1. On a browser that already works, open the admin.
2. Click **Copy admin invite link** (top of the client list).
3. Send that link to yourself, then open it on the new device. It unlocks and goes straight in.

## Giving a teammate access

1. Same as above: **Copy admin invite link** and send it to them privately.
2. Only to people you trust. Anyone with the link can see every client's answers.
3. Never send it to a client, and never put it in a shared channel.

## Locked out, or the code has leaked (someone left, link sent to the wrong person)

Set a new code. This logs out every browser using the old one.

1. Pick a new code: a long random phrase you don't use anywhere else.
2. In Terminal, run the command below. It asks you to type the new code (nothing shows as you type),
   then press Enter.
3. Open the live admin and paste the new code into the lock screen.
4. Use **Copy admin invite link** to re-share it with anyone who still needs access.

```bash
cd /Users/jesseallan/Master/AI/customerjourney-app && npx wrangler secret put ADMIN_ACCESS_TOKEN --name scale-onboarding-portal
```

If Terminal says you're not logged in, run `npx wrangler login` first and click Allow in the browser.
