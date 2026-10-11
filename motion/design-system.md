# Design system — Scale portal motion redesign (draft 2026-10-11)

Checked against `bar.md`. Accent chosen by Jesse on 2026-10-11: Cobalt.

## Colour
| Token | Hex | Use |
|---|---|---|
| Gallery white | `#FFFFFF` | Page canvas, cards |
| Mist | `#F5F5F7` | Alternate bands behind white cards |
| Ink | `#1D1D1F` | Headlines and body text |
| Slate | `#707070` | Secondary text |
| Hairline | `#D6D6D6` | 1 px borders and dividers |
| Accent, Cobalt | `#1F4BFF` | The welcome field, the one primary button, the current-stage mark |

Accent candidates considered (Jesse chose Cobalt):
- **Cobalt `#1F4BFF`** (recommended). Floods a full screen, carries white type at about 6:1 contrast, and works as a
  button and a link colour on white.
- **Hi-vis `#D4F53C`.** A lime that nods to site gear without drawing a tool. It carries ink type, not white, and it
  can only be a fill: lime text on white is unreadable, so links and small marks would fall back to ink.

The accent appears at most twice on any screen except the welcome, which it floods.

## Type
One family: **Geist** (Google Fonts), weights 400, 500, 600.

| Role | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Welcome wordmark | 106 px (64 px on phones) | 600 | 1.0 | -0.02em |
| Stage title | 80 px (48 px on phones) | 600 | 1.05 | -0.015em |
| Card title | 24 px | 600 | 1.17 | -0.01em |
| Lead | 21 px | 400 | 1.38 | 0 |
| Body | 17 px | 400 | 1.47 | -0.01em |
| Label | 13 px | 500 | 1.3 | 0 |

Headlines run two lines at most. A stage title is one word.

## Space and shape
- 8 px base. Section gaps 96 to 128 px on desktop, 56 to 72 px on phones. Content width 1200 px at most.
- Media frames and cards: 28 px corners. Buttons: full pill. No shadows; 1 px hairline borders only.
- At least 40% of every screen is empty. One object per screen, centred.

## Motion
- The welcome film plays once, about 8 seconds, then holds on a loop of the finished stack.
- Handoff to the journey page: the colour field contracts into the current-stage mark over 700 ms.
- Stage opener: the one-word title rises 24 px and fades in over 600 ms.
- Easing `cubic-bezier(0.2, 0.7, 0.2, 1)`. Nothing under 400 ms. One thing moves at a time.
- `prefers-reduced-motion`: no film, the final still is shown, all transitions are instant.
