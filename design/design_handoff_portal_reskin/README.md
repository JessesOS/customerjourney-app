# Handoff: Scale Onboarding Portal — Organic Reskin

## Overview
A pure visual reskin of the live Scale Onboarding Portal (`customerjourney-app`). Warmer sand ground, terracotta action colour, deepened status inks, Figtree replacing Hanken Grotesk. **No UX, flow, markup or API changes** — this is a token-level restyle of what's already shipped.

## About the Design Files
The HTML files in this bundle are **design references** — restyled copies of the component-preview snapshots that came *from* the production repo. They are not production code. The task is to apply the visual deltas to the real components in the existing codebase (`app/components/portal/` + `app/globals.css`), keeping every component's structure and API exactly as it is.

## Fidelity
**High-fidelity.** These previews share the production components' DOM structure; only `<style>` blocks and the Google Fonts `<link>` differ from the snapshots you exported. Diff each file against your originals to see exactly what changed.

## ⚠ Guardrail (from the design brief)
Do **not** restructure markup, rename/re-API components, or move anything around. Reskin only. The four-status vocabulary (Done / Your turn / With us / Up next, + Locked), the 5-stage rail structure, and all layouts stay identical.

## Where to apply it
1. **`app/globals.css :root`** — replace the `--pj-*` values per the token table in `token-delta.md`. This carries ~90% of the reskin.
2. **Inline hardcodes** — a handful of hexes live inline in components (TaskRow's your-turn row tint, StageRail's progress track, locked-dot borders, shadow/glow rgba values). `token-delta.md` § "Non-token hardcodes" lists each with its replacement. Consider promoting these to tokens while you're in there — optional, does not change rendering.
3. **Font loading** — swap Hanken Grotesk for Figtree (variable, 300..900). Existing weights (450/550/650/750) work as-is. IBM Plex Mono is unchanged. New request:
   `https://fonts.googleapis.com/css2?family=Figtree:wght@300..900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap`
4. **`PortalButton.tsx`** is dead code (per your own notes) — leave it or delete it; it is intentionally not covered.

## Design Tokens
Full before/after table with Organic ramp sources: **`token-delta.md`** (the spine of this handoff). Summary:
- Ground #f5ead8 · rail #eee7db · card #f9f4ed (off pure white) · ink #201e1d
- Action terracotta #c67139 (fill #ffe1d0, ink-on #fff2eb)
- Done #56633f / #e1eecc · With us #7d5468 / #efdfe6 (OKLCH-derived plum) · Up next #a19786 / #eee7db
- Radii unchanged: 16 / 12 / 999. Shadows: same recipes, ink base rgba(46,43,37,…).
- Type: Figtree everywhere (headings just heavier, 600–800); IBM Plex Mono for chips/kickers only.

## What changed & why
See `token-delta.md` § "What changed & why" — 6 numbered intent notes (warmer ground, one action colour, 700-step status inks, harmonised plum, one type family, mono kept).

## Files
- `token-delta.md` — token delta table + non-token hardcodes + rationale. **Read first.**
- `tokens.html` — restyled token/type sheet (maps to `globals.css :root`)
- `status-chips.html` — StatusChip.tsx, 5 states
- `task-row.html` — TaskRow.tsx, all row states
- `up-next-card.html` — UpNextCard.tsx, actionable + waiting
- `stage-rail.html` — StageRail.tsx, 5-stage nav
- `stage-complete.html` — StageCompleteView.tsx, payoff screen

## Interactions, State, Assets
Unchanged from production — no new interactions, state, or assets. Hover/pressed/focus states keep their existing behavior with the new colour values (focus ring should use the new `--pj-act`).
