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
- Step 2 of the scope, the new look across the journey page: done as piece 2, below.
- The old Marquee and Mosaic welcomes still say "Built for the trades" and show trade tiles.

## 2026-10-11: piece 2, the look carried onto the journey page

**Built:** `app/components/portal/CobaltHub.tsx`, the journey home in the new look, plus a
`[data-pj-design="cobalt"]` token block and `gx-*` classes in `app/globals.css`. It is the third option on the demo
design pill: Current design, Handoff design, Cobalt design. The demo route opens on Cobalt on this branch, so the
flow is funnel welcome, then the cobalt journey page.

**What it is:** white and mist bands, Geist only, 28 px corners, hairlines, no shadows. Each stage opens on its
one-word title at display size. The stage's tasks sit beside it as bars that draw in, echoing the booked rows of the
funnel. Cobalt is used twice: the current segment of the stage strip and the one primary button. Because the look
rides the `--pj-*` tokens, the task view, the stage-complete card and the $200 popup pick it up without their own
rebuild.

**Copy:** all existing wording, word for word (task titles, details, waiting-state lines, labels). Nothing new written.

| Check | Result |
|---|---|
| Typecheck (`npx tsc --noEmit`) | 0 errors |
| Build | complete |
| Funnel, handoff, cobalt page, $200 popup at `/portal/demo?welcome=1` | works, 1440 px |
| Task list opens, up-next task opens in the task view | works |
| 375 px phone | stacks, no sideways scroll |
| Console errors from the new code | none |

**Not done / not run**
- Critics and the sparring agent: not run (not asked for).
- Reduced motion: CSS rule written, not tested in a browser.
- Stage-complete card and later stages (2 to 5): not looked at in a browser under Cobalt, only stage 1.
- Dark scheme: none for Cobalt.
- "cobalt" is a review option only. Nothing stores it per client; real client portals are unchanged.
- The demo review pills use the cobalt accent, so on the demo route cobalt shows more than twice. Clients never see them.
- No credits spent.

## 2026-10-11: piece 2, second pass (Jesse's review)

Jesse's call on the first pass: it lost the framing and functions of the other designs. No journey rail, no
Journey rail / Focus choice, the task list sat too far down the page, and the bar graphic by the title did not read.

**Rebuilt** `CobaltHub.tsx` on the same frame as the other designs: sticky header and stage strip, a journey rail
(click a stage to open it, overall progress at the foot), and one main card with the title, the up-next action and
the task list expanding in place straight under it. Journey rail / Focus works on the pill again, rail by default.
The bar graphic is gone; the tasks show as small segments in the task-list header instead.

Checked in a browser: rail and focus at 1440 px, task list open, a rail click into the Build stage, 375 px phone
(rail hides, no sideways scroll). Typecheck 0 errors, build complete. Still not checked: stage-complete card and the
home page of stages 2 to 5, reduced motion. Critics not run.

## Credits
22 spent (11 keyframe images), all on the parked disc film. Quote ceiling was 225. Balance 736.

## Gap history
- Keyframes r1: discs lay on a floor in frame 2; six discs in frame 4. Remade.
- Keyframes r2: frame 2 grew an eighth disc. Remade.
- Keyframes r3: frame 2 had six discs. Seventh disc pasted in by hand, free.
- Concept: abstract discs did not read as the offer. Replaced by the 2D funnel.
