# The bar — Scale portal motion redesign

Seven mechanisms from Jesse's three references (Apple iPhone Duo, Jeton, Shopify Editions). Each can be checked on a
screenshot or a filmstrip. Draft of 2026-10-11: Jesse's word changes any line.

1. **Colour.** Gallery white `#FFFFFF` canvas, mist `#F5F5F7` bands, ink `#1D1D1F` text, slate `#707070` secondary
   text, hairline `#D6D6D6`. One accent colour, used at most twice per screen. The welcome is the one screen the
   accent floods edge to edge. The accent itself is an open question (see BRIEF).
2. **Type.** One grotesk family in three weights (400, 500, 600). Display 80 to 106 px at weight 600, line height
   1.05, tracking about -0.015em. Body 17 px, so a headline is at least 5 times the body size. Headlines run two
   lines at most. A stage title is a single word.
3. **Layout.** One object per screen, centred. At least 40% of every screen is empty. White sections alternate with
   mist bands that hold white cards. Media frames have 28 px corners. No shadows anywhere; hairline borders only.
4. **The welcome.** One flat field of colour with one abstract 3D form behind the headline. Headline bottom-left,
   the single action bottom-right, the wordmark top-left, nothing else on screen.
5. **Imagery.** One material world: soft matte forms with a thin lighter rim, in tones of a single hue. Shapes are
   discs, rings and coils. No tools, no people, no text, no logos inside any image.
6. **Motion.** One form that transforms and never cuts. Each move takes 4 seconds or longer. A stage change brings
   its title in over 600 ms or longer. Nothing animates for under 400 ms. One thing moves at a time.
7. **Chapters.** Each of the five stages opens on its one-word title at display size (Onboarding, Build, Testing,
   Go-Live, Post-Launch) over its own scene, then the cards for that stage.

## Laws for every site
1. No jumps in any video. Scroll films: clip N's first frame IS clip N-1's last frame, and no clip
   cuts or dissolves inside (adjacent-frame scan, no frame below median - 0.25). Loops: first frame = last frame.
2. Every section has a motion graphic that explains the section, not just copy and a photo.
3. The Off / On / X-ray switch stays on every site.

## How the laws apply to this project
This is a live client app, not a one-page site. The switch (law 3) is shown on the demo route only, as on Jesse's
portfolio; `prefers-reduced-motion` still starts every client in Off. "Section" (law 2) means an area of the
portal: the welcome, the handoff into the journey, each stage opener, stage complete.

## Style suffix (ends every Higgsfield prompt)

Premium abstract 3D render: soft matte cobalt blue discs, each with a thin lighter blue rim, in tones of a single blue hue, floating in a flat seamless cobalt blue #1F4BFF field with no floor and no horizon, soft even studio light from the upper left, very soft shading, everything in focus, 50mm lens, calm, generous negative space. No text, no letters, no numbers, no logos, no people, no tools, no devices.
