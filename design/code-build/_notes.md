# Code Build — the existing production portal

These files are a faithful snapshot of the **live client portal** already shipped in
`customerjourney-app` (the "Scale Onboarding Portal"), pushed here so the design work has
the real build as reference — not screenshots, the actual markup, tokens and states.

**Source of truth:** `app/components/portal/` + `app/globals.css` (`--pj-*` tokens).
These preview cards are self-contained (inline tokens + Google Fonts) and deliberately do
**not** link the Organic `styles.css` — the portal is its own single warm theme.

## What each card is

| File | Real component | Notes |
| --- | --- | --- |
| `tokens.html` | `globals.css :root` | The `--pj-*` palette, radii, and live type specimen. |
| `status-chips.html` | `StatusChip.tsx` | The 4-status vocabulary + Locked. |
| `task-row.html` | `TaskRow.tsx` | List row in every state; "Your turn" is highlighted + gets Start. |
| `up-next-card.html` | `UpNextCard.tsx` | The hero card — actionable vs. waiting-on-team. |
| `stage-rail.html` | `StageRail.tsx` | The persistent 5-stage journey nav (structural signature of the redesign). |
| `stage-complete.html` | `StageCompleteView.tsx` | The stage-completion payoff screen with next-stage preview. |

## Palette (warm, single theme)

- Ground `--pj-bg #f6f2ea`, rail `--pj-rail #f1eae0`, card `#ffffff`, ink `#2c2620`.
- **Action** = clay-orange `--pj-act #d97757` — the one action colour.
- **Done** = sage `--pj-done #5f7a4e`. **With us** = plum `--pj-withus #8a5b72`.
  **Up next / Locked** = stone `--pj-upnext #9a8f80`. Each has a `-fill` tint.
- Radii: card 16 / sm 12 / pill 999.

## Type (IMPORTANT — supersedes older docs)

Both headings and body are **Hanken Grotesk** (headings just run heavier, 600–800);
**IBM Plex Mono** is reserved for status chips and kickers. An earlier note claimed
Fraunces for headings — that was **retired**; this is the current production type.

## Not included on purpose

`PortalButton.tsx` exists in the repo but is **dead code** (imported nowhere) and is
styled for the old dark theme, so it is not represented here. The live buttons are the
inline pill/`--pj-act` buttons shown inside TaskRow, UpNextCard and StageCompleteView.
