# BRIEF — Scale portal motion redesign

**What this is:** a slicker rebrand of the client portal's welcome and journey page, made with the Claude Motion
Design workflow (`~/Master/Side_Projects/Workflows/Jack/claude-motion-design.md`). Working files live in `motion/`
inside this repo. The result is built into the existing portal as a new demo option. Nothing replaces the current
default until Jesse picks it.

**Jesse's words (2026-10-11):** "another branding redesign. I want to make it way slicker." "The movement when it
first opens or on the landing page could be relevant to the product and the offer itself, meaning the funnel. Doesn't
have to relate to tradies, can be quite wide open." "More movement, more motion as we transition to the actual
onboarding customer journey page."

- **Brand:** Scale (and Respond) by RT Digital. A client onboarding portal: five stages over 30 days for Scale, four
  over 10 for Respond. Clients are trade business owners, mostly on phones.
- **Vibe:** A white gallery with one bold colour. Calm, confident, expensive. Motion explains; it does not perform.
- **The journey (one move):** "Scatter to stack." Seven loose discs drift toward one point and settle into a single
  neat stack. It reads as enquiries from everywhere becoming one organised pipeline. Abstract on purpose, so one film
  serves both Scale and Respond.
- **How it plays:** once, on its own, when the welcome opens. Not on scroll: a client wants to get in. The button is
  live from the first frame. The film ends on a held loop of the finished stack.
- **Scope, in order:** (1) the film welcome and the handoff into the journey page; Jesse reviews; (2) the new look
  across the journey page with a one-word opener per stage.
- **The action:** "Get started" (existing button, existing behaviour).
- **Budget:** Taster plus a phone film. 196 credits planned, 225 with the remake buffer. Balance at quote: 758.
- **Accent colour:** Cobalt `#1F4BFF`, replacing terracotta in this look. Jesse's pick.

## Copy (word for word, from the current welcome)
Wordmark "Scale" or "Respond". Button "Get started". Legal line "Terms & Conditions · Privacy Policy". The incentive
popup and all journey copy are unchanged. **The tagline "Built for the trades" is removed (Jesse, 2026-10-11):** "it's
not for trades anymore... it's probably not going to be called Scale but you can leave Scale there... take out trades,
it'll be a general offer to anyone." No replacement line until Jesse writes one.

## Do-nots
- Do not change copy, claims or offers. Do not invent clients, numbers, testimonials or credits.
- Do not touch the live site. Do not deploy or publish. Work on a branch: the other session deploys from `main`.
- No tools, people, devices, ads or text inside any generated image.
- Never let an object appear between keyframes: all seven discs are in every keyframe. Clips run one after another.
- Do not touch GHL, the CSM repo, the brain repo, webhooks or schema (Stream 3 lane).
- The Off / On / X-ray switch shows on the demo route only. Clients never see it.
- The skill's sparring and critic agents are not run unless Jesse asks. Say so in every report.

## Change of plan (2026-10-11, later the same day)
The welcome is the **2D funnel drawn in code**, not the rendered disc film. Jesse: "I'm struggling to visualize this...
it sounds like it's a bit much, that sort of render, that sort of time", then on seeing the 2D sketch: "I'm happy with
this... keep building." The disc film is parked with its keyframes paid for (22 credits). See `progress.md`.

## Decisions Jesse made (2026-10-11)
Journey: scatter to stack. Scope: welcome first, then journey. Accent: Cobalt #1F4BFF. Budget: Taster + phone film, yes to a 225 credit ceiling.

## Paths
`refs/` captures and notes. `bar.md` the bar. `design-system.md` the system. `film/storyboard.json` wide film,
`film-phone/storyboard.json` phone film. `kf/` and `kf-phone/` keyframes. `ledger.tsv` every credit spent.
