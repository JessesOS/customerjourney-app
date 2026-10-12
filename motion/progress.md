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

## 2026-10-11: piece 3, a second look for the inside ("Aurora design")

Jesse on Cobalt: flat, boring, a bit busy. Keep it as an option, find another look. His new references: the
brain.fm app (night ground, one giant figure under a progress arc, art tiles of flowing lines), a dark dashboard
with glowing orbs, Dala (https://styles.refero.design/style/e5f5f8cf-e68d-4ed1-bbf5-6b67569af648, particles on
black, huge light-weight type) and Mercury (https://styles.refero.design/style/3172cd4d-118a-4a16-a259-6b634d32322e,
near-black, cinematic, one accent). The welcome stays as it is.

**Built:** `app/components/portal/AuroraHub.tsx`, a `[data-pj-design="aurora"]` night token block and `ax-*`
classes, font Outfit. Fourth option on the demo design pill; the demo route opens on it on this branch.
- Night ground. Each stage has its own field of flowing lines, drawn in code on canvas: large and moving behind
  the current stage, small on that stage's tile in the journey rail. No images, no video, no credits.
- The stage's one word sits huge under a progress arc. One white "Start this task" button.
- Same frame and functions as the other designs: journey rail / focus, stage clicks from the rail, task list
  expanding in place, happening with us, ask chips. Task view and the $200 popup go dark through the tokens.
- Copy: existing wording only.

Checked in a browser: home at 1440 px, task view, $200 popup, 375 px phone (no sideways scroll). Typecheck 0 errors.
Not checked: focus layout, expanded task list, stages 2 to 5 (each has its own colours), stage-complete card,
reduced motion, frame rate on a slow machine. Critics not run.

## 2026-10-11: piece 4, Aurora welcome and "Aurora calm"

Jesse on Aurora: "pretty sick", keep it, but possibly too edgy for a marketing-funnel onboarding. Asked for both a
matching welcome and a dialled-back version.

- **Aurora welcome** (`app/components/portal/WelcomeAurora.tsx`), reference the brain.fm landing hero. Night stage,
  wordmark at display size, and under it the stage names cycling one at a time on a colour bar, each with its own
  field of lines; a strip of all five stages along the bottom; one white "Get started". No new copy. Fourth option
  on the welcome pill, and the default welcome when the demo opens on Aurora. The funnel welcome is unchanged.
- **Aurora calm**: fifth option on the design pill. Same page and functions, quieter: graphite cards, the art as a
  soft band, no arc, no sparks, a smaller left-aligned title with a slim progress bar.

Checked in a browser: welcome at 1440 px and 375 px, handoff into the journey page, Aurora calm home at 1440 px.
Typecheck 0 errors, build complete. Not checked: Aurora calm on a phone, its task list open and focus layout,
reduced motion. Critics not run. No credits spent.

**Open, Jesse's call:** the product name. He wants something more explicit than "Scale" (along the lines of AI
marketing). "Scale" stays in the build until he picks.

## 2026-10-11: piece 5, a third look for the inside ("Grove design")

Jesse: Aurora went over the top and Aurora calm was painful. The original was too warm, Cobalt too cold. It is an
onboarding step-through, so it must be very clean and not distract. Asked for one more look in one shot: the most
elegant, fonts Vercel would use, and he likes clay.com (https://www.clay.com/). Motion on the journey rail and on
the way in from the start page.

**Built:** `app/components/portal/GroveHub.tsx`, a `[data-pj-design="grove"]` token block and `gv-*` classes.
Sixth option on the demo design pill; the demo route opens on it on this branch.
- Soft off-white ground, white cards, near-black type. Geist for text, Geist Mono for small labels and figures.
- Colour lives in one place: a deep green band holding the stage name, its progress and the one action (a lime
  "Start this task" button), with two soft hills drawn in SVG drifting slowly behind.
- Journey rail is a stepper: the line draws down to the current stage, the current node breathes, steps arrive
  one after another, a step nudges on hover. Click a step to open that stage.
- The funnel welcome takes the same green when Grove is the active look, so the welcome closes into a page that
  carries its colour.
- Same functions as the other designs. Copy: existing wording only.

Checked in a browser: green welcome, handoff, home at 1440 px, task list open, task view, 375 px phone (no sideways
scroll). Typecheck 0 errors, build complete. Not checked: focus layout, stages 2 to 5, stage-complete card,
reduced motion. Critics not run. No credits spent.

## 2026-10-11: piece 6, Grove picked, rail depth, voice interview task

Jesse: Grove is "the winner for now". Two asks.
- **Rail depth:** the Grove journey rail is now its own shaded panel (deeper off-white, hairline, soft shadow), so
  it reads as a separate thing from the main body. The current step sits on it as a white card.
- **Voice interview as the first task:** new `ob-0` "Your voice interview" ahead of the intake form, so Onboarding
  is 11 tasks and the form is task 2. `app/components/portal/VoiceInterview.tsx`: one question at a time, a mic
  button (browser speech recognition, free, no backend), the words land in an editable box, typing works too.
  Saved as the task's note. Works in every look through the tokens.
- **New copy, first draft for Jesse to edit:** the task title, its one-line detail, six interview questions, and
  the labels inside the interview. All in `lib/onboardingJourney.ts` and `VoiceInterview.tsx`.

Checked in a browser (demo client, typed answers): home shows the interview as up next and 0 / 11, the interview
opens, next question, finish, lands on task 2 of 11 (the form). Typecheck 0 errors, build complete.
Not checked: speaking into the mic (cannot be tested from here), saving against a real client record, a phone,
Firefox (no speech recognition there, typing only). It is not a two-way AI voice agent: nothing speaks the
questions or asks follow-ups. Cross-lane notes are in `docs/customer-journey-master-plan.md`.

## 2026-10-11: piece 7, the interview asks its questions out loud

Jesse asked whether the interview could ask the questions in his voice, or any voice for now. Went with any voice
now: six clips rendered once with the free Sonia voice the stage guide already uses
(`scripts/generate-interview-voice.py` → `public/portal/voice/interview-ob-0-1..6.m4a`). Each clip plays as its
question appears; "Hear it" replays; the portal's voice toggle silences it; starting the mic stops the clip.
Swapping in Jesse's voice later (Fish Audio) means replacing those six files, no code change.
Re-run the script whenever a question's wording changes.

Checked through the page: clip 1 is requested and plays when the task opens, clip 2 on the next question, files
serve as audio. Not checked by ear (cannot listen from here), nor on a phone, where browsers are stricter about
sound starting on its own. No credits spent.

## 2026-10-11: piece 8, interview voice switched to Fish Audio ("Jack")

Jesse wanted an Aussie, more natural voice. He added `FISH_API_KEY` to `.env.local` himself. Auditioned question 1
in 14 Fish Audio library voices (clips in `motion/voice-audition/`, not committed); celebrity and character clones
were left out on purpose. His pick: "Jack", a young, casual Australian man (model `4c26db2c00a346f687aa8ed984c418b5`).
All six question clips re-rendered in that voice; `scripts/generate-interview-voice.py` now uses Fish Audio by
default (`--free` falls back to the Sonia voice). The stage voice guide on the home page is still Sonia, so the
portal currently has two voices.

Fish Audio spend for the whole audition plus the six clips: about 1 cent (balance 9.695 → 9.684 USD).
Not checked by ear by me. The last clip is short for its sentence (2.1 s), so worth a listen for pace.

## 2026-10-11: piece 9, interview voice changed again

After hearing Jack in the portal, Jesse auditioned 18 more voices (32 in all, about 2 cents) and picked the calm,
gentle Australian woman (`w5-calm-gentle`, Fish Audio model `1ac1da8f595841fe9ca8b5cb464364f8`). All six clips
re-rendered; the script's default voice updated. Not checked by ear by me.

## 2026-10-12: merged and deployed to production

Jesse is pitching and has no real clients yet, so he asked for everything live. `motion-redesign` fast-forwarded
into `main` (no conflicts, main had not moved), pushed, built and deployed to the Cloudflare worker
`scale-onboarding-portal` (version `44cd957b`). Jesse re-authorised the deploy tool himself.
Checked live: `/portal/demo` loads and opens in Grove, the interview audio serves, the admin API refuses a visitor
without access (403). Not checked live: clicking through the page in a browser, the mic.
The demo route still shows the review pills. Grove, Cobalt and Aurora are still demo-only options: no client can
be assigned them yet.

## 2026-10-12: piece 10, the interview becomes a voice call with an orb

Jesse: make task 1 purely the voice interview, like a voice-AI phone call. A big glowing orb as the interviewer,
greens moving round inside it, with the transcript underneath.

Rebuilt `VoiceInterview.tsx`: one orb (a turning conic gradient of greens with a lime core, a glow that breathes,
drawn in CSS). Tap once to start. The interviewer asks out loud, the mic opens by itself when the clip ends, the
client taps the orb when they have finished, and the next question follows. A running transcript sits underneath
(Interviewer / You); any answer can be typed or edited. The task footer stays hidden until there is an answer.
New labels are mine: "Tap to start", "Asking…", "Listening. Tap when you've finished.", "Type your answer, then
tap to go on.", "All done. Thank you.", "Hear it again", "Type instead", "Speak instead", "Previous question".

Checked on the dev server with typed answers: orb idle, asking, fall-back to typing when the mic is refused, tap
to go on, question 2 asked, transcript builds, Finish appears once there is an answer. The mic itself cannot be
tested from the Browser pane (it blocks microphone access), so listening is untested by me. Not yet deployed.

## 2026-10-12: piece 11, the interview is a live voice agent

Jesse wanted a real back-and-forth, like the voice agents he has built before: one prompt behind the voice holding
the goal and the questions. Fish Audio is a voice, not an agent, so this uses ElevenLabs Agents. Jesse created the
agent (`agent_3001m4pqxn11ecs9s47qarwvsbp1`, public) from the prompt in `motion/interviewer-prompt.md`.

`VoiceInterview.tsx` now starts a live call when the task has an `interviewAgentId` (new optional field on the
milestone, `lib/journeyEngine.ts`): the orb swells with whoever is talking, the transcript fills in live, and when
the call ends the whole transcript is the task's note. New dependency: `@elevenlabs/client`. If the mic is refused
or the call cannot connect, it drops to the scripted interview with a one-line explanation; "Type your answers
instead" does the same by choice.

Checked: typecheck 0 errors, build complete, the agent's public endpoint answers, and the mic-refused fallback
works on the dev server. NOT checked: an actual call. The Browser pane blocks the microphone, so the live
conversation, the transcript filling in and the save at the end are untested by me. Jesse to test in Chrome.
Each call bills Jesse's ElevenLabs account per minute; the agent is capped at five minutes. A public agent id
means anyone who finds it can start a call. Not yet deployed.

## 2026-10-12: second production deploy

Jesse tested the live voice agent on his Mac ("the interview is great") and asked to publish. Two things shipped:
Grove is now a look a client can be given and the default for new clients (admin create form, webhook-provisioned
clients, `PortalThemeVariant`), and the voice-agent interview. Merged to `main`, deployed as version `b448a7cb`.
Checked live: demo and admin load, admin data refuses a visitor without access, the deployed bundle carries the
agent id. Not checked live: a call on the live site, or a real client record end to end.

## 2026-10-12: piece 12, presentation switch and "Grove Aurora"

- **Presentation switch** (deployed, version `90e36219`): a small eye button bottom right on the demo route hides
  and shows every review pill; remembered in the browser.
- **Grove Aurora:** Jesse loves Grove, found Aurora calm did not work, and wanted Grove with accents from the
  Aurora welcome. Same page, type and off-white ground as Grove. The green band becomes a night band lit with the
  stage's own three hues and its field of lines; the rail's fade takes the same hues, very pale; violet is the
  working accent; the main button is the stage's gradient; the interviewer orb takes the colours too. It opens on
  the Aurora welcome. Eighth option on the demo pill, demo-only (not assignable to a client).
  Checked at 1440 px on the dev server, stage 1 only. Typecheck 0 errors.

## Credits
22 spent (11 keyframe images), all on the parked disc film. Quote ceiling was 225. Balance 736.

## Gap history
- Keyframes r1: discs lay on a floor in frame 2; six discs in frame 4. Remade.
- Keyframes r2: frame 2 grew an eighth disc. Remade.
- Keyframes r3: frame 2 had six discs. Seventh disc pasted in by hand, free.
- Concept: abstract discs did not read as the offer. Replaced by the 2D funnel.
