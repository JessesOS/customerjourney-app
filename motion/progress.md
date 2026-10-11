# Progress — Scale portal motion redesign

## 2026-10-11: piece 1, the welcome

**Built:** `app/components/portal/WelcomeFunnel.tsx`, the default welcome on the `motion-redesign` branch.
A cobalt field with the offer drawn in code on one canvas: enquiries (dots) arrive from everywhere, squeeze through a
funnel and land as booked rows that fill and reset. Left to right on desktop, top to bottom on phones. "Get started"
closes the field into the button over 700 ms and hands off to the journey page. Font Geist. No video.

**Changed on Jesse's word:** the tagline "Built for the trades" is removed from this welcome (the offer is now
general, and the product may be renamed; "Scale" stays as a placeholder). No replacement line was written.

**Why not the film:** the rendered disc film was the first plan. Jesse could not read it as his offer, and the
render (180 credits, about an hour) was heavy for a small intro. A free 2D funnel sketch read at a glance, so it
became the welcome. The disc keyframes are parked, not rendered: `kf/` and `kf-phone/` (job ids kept).

| Check | Result |
|---|---|
| Typecheck (`npx tsc --noEmit`) | 0 errors |
| Build | complete |
| Loads in the portal at `/portal/demo?welcome=1` | yes, desktop and 375 px phone |
| Handoff to journey page, then the $200 popup | works |
| Reduced motion | shows the still picture, no animation, instant handoff (read from code, not tested in a browser) |
| Console errors from the new code | none |

**Not done / not run**
- The skill's sparring agent and three critics were not run (Jesse has not asked for them).
- The Off / On / X-ray switch is not wired in. The canvas carries its `data-xray` tags ready for it.
- SlopMonster and the copy gate were not run: no copy was written, only one line removed.
- Jank was not measured with the skill's script.
- Step 2 of the scope, the new look across the journey page with one-word stage openers, is not started.
- The old Marquee and Mosaic welcomes still say "Built for the trades" and show trade tiles.

## Credits
22 spent (11 keyframe images), all on the parked disc film. Quote ceiling was 225. Balance 736.

## Gap history
- Keyframes r1: discs lay on a floor in frame 2; six discs in frame 4. Remade.
- Keyframes r2: frame 2 grew an eighth disc. Remade.
- Keyframes r3: frame 2 had six discs. Seventh disc pasted in by hand, free.
- Concept: abstract discs did not read as the offer. Replaced by the 2D funnel.
