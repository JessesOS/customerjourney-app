# Token delta — Scale Onboarding Portal → Organic reskin

Same DOM, same component API, same four-status vocabulary. Only visual values change.
Every value below is grounded in the Organic token sheet (`styles.css`); ramp step named in brackets.

## Colour tokens

| Token | Was | Now | Organic source |
| --- | --- | --- | --- |
| `--pj-bg` | #f6f2ea | **#f5ead8** | `--color-bg` |
| `--pj-rail` | #f1eae0 | **#eee7db** | neutral-200 |
| `--pj-card` | #ffffff | **#f9f4ed** | neutral-100 (pure white is too stark on the deeper cream) |
| `--pj-ink` | #2c2620 | **#201e1d** | `--color-text` |
| `--pj-muted` | #877c6e | **#82796a** | neutral-600 |
| `--pj-faint` | #afa394 | **#a19786** | neutral-500 |
| `--pj-line` | #e7dfd2 | **#dcd3c4** | neutral-300 |
| `--pj-line-soft` | #f0eae0 | **#eee7db** | neutral-200 |
| `--pj-act` | #d97757 | **#c67139** | `--color-accent` |
| `--pj-act-fill` | #f9e7dd | **#ffe1d0** | accent-200 |
| `--pj-act-ink` | #fff8f3 | **#fff2eb** | accent-100 |
| `--pj-done` | #5f7a4e | **#56633f** | accent-2-700 (700 step for text-on-tint contrast) |
| `--pj-done-fill` | #e5ead7 | **#e1eecc** | accent-2-200 |
| `--pj-withus` | #8a5b72 | **#7d5468** | derived in OKLCH — plum has no Organic ramp, so hue kept, lightness/chroma matched to the 700 steps |
| `--pj-withus-fill` | #f1e3ea | **#efdfe6** | derived, matched to the 200 steps |
| `--pj-upnext` | #9a8f80 | **#a19786** | neutral-500 |
| `--pj-upnext-fill` | #efe9df | **#eee7db** | neutral-200 |

## Non-token hardcodes (inline in components)

| Where | Was | Now |
| --- | --- | --- |
| TaskRow "your turn" row tint | #fbf3ec | **#fff2eb** (accent-100) |
| StageRail progress track | #e2d5c6 | **#dcd3c4** (neutral-300) |
| Locked/up-next dot border | #dbd2c2 | **#c0b6a5** (neutral-400) |
| Card shadow ink | rgba(60,46,32,.45) | **rgba(46,43,37,.42)** (neutral-900 base) |
| Act-button glow | rgba(217,119,87,.5) | **rgba(198,113,57,.5)** |
| Done-badge glow | rgba(95,122,78,.55) | **rgba(86,99,63,.5)** |

## Type

| Slot | Was | Now |
| --- | --- | --- |
| `--font-heading` | Hanken Grotesk 600–800 | **Figtree 600–800** (same family as body, run heavier — mirrors the production pattern) |
| `--font-body` | Hanken Grotesk | **Figtree** (variable 300–900; existing 450/550/650 weights render as-is) |
| `--font-mono` | IBM Plex Mono | **unchanged** — chips/kickers keep the mono voice; Organic has no mono, this stays a portal signature |

Google Fonts request: `Figtree:wght@300..900&family=IBM+Plex+Mono:wght@400;500;600;700`

## Radii & shadows

Unchanged: card 16 / sm 12 / pill 999 already sit on Organic's radius scale (`--radius-md` = 16). No restructuring anywhere.

## What changed & why

1. **Ground got warmer.** #f6f2ea → #f5ead8 shifts the whole portal from near-grey cream to Organic's sand. Cards move off pure white onto neutral-100 so they sit *in* the page, not on it.
2. **One action colour stays one action colour** — clay #d97757 becomes terracotta #c67139 (the Organic accent). Everything that was act-coloured follows automatically.
3. **Status inks deepened to the 700 steps.** Done/with-us inks now hit text-on-tint contrast per Organic's ramp rule; fills brightened to the 200 steps. The four-status vocabulary is untouched semantically.
4. **Plum kept, harmonised.** "With us" has no Organic ramp, so it was re-derived in OKLCH on the shared lightness scale rather than replaced — the vocabulary keeps its third voice.
5. **One type family throughout.** Figtree replaces Hanken Grotesk one-for-one — headings keep the heavier-weight pattern (600–800), so no size or weight remapping is needed anywhere.
6. **Plex Mono kept.** It's the portal's functional signature for chips/kickers; Organic defines no mono, so nothing to conform to.

**Guardrail honoured:** zero DOM changes — diff any file in `reskin/` against `uploads/` and only `<style>`, the font `<link>` and the type-specimen copy differ.
