# Tiny ROR: Launchpad spec

Saved word for word on 2026-11-08 from the Tiny ROR session's two handover files. Jesse approved the 23-step list in the portal session on 2026-11-08 ("Yes, build it").

---

## Source 1: tiny-ror/notes/2026-11-08-launchpad-onboarding-brief.md

# Brief for the Launchpad session: Tiny ROR onboarding (2026-11-08)

Sent by message to the "Launchpad – AT Network portal" session (`~/Master/AI/customerjourney-app`) on Jesse's yes ("Yes, send it", 2026-11-08). Delivery wasn't confirmed, so this copy is the record. Paste it into that session if it never arrived.

**Ask:** add a third custom product, `products/tiny-ror/`, following the `at-network` pattern, so Luisa does her Tiny ROR setup through Launchpad instead of WhatsApp.

1. Leave `at-network` and `bss-custom` untouched. `check:journeys` and `check:fin` must still pass.
2. Steps come from `tiny-ror/luisa-checklist.md` (the 22-item to-do list plus the 25 interview questions). For each step: Luisa-facing wording in plain words, what "done" looks like, and the type (tick, form, upload or booking).
   - Step 1: book a time with Jesse this week.
   - Step 2: record the interview (about 45 minutes) and upload it.
   - Child safe policy and consent form: Jesse drafts, Luisa checks.
   - Stripe, Meta Business and Google: Luisa sets them up herself. Never ask for passwords or keys.
3. Brand from `tiny-ror/site/README.md`: red #FF4438, cream #F1E0CB, Figtree, "ror", never "roar".
4. Show Jesse the step list first. Ask before creating the portal in prod, deploying, or inviting or sending anything to Luisa. Use the usual deploy package.
5. When done, record the product name and `portal_id` in this folder's `CLAUDE.md`.

Context: `tiny-ror/brief.md` (sections 9 and 10) and the Tiny ROR section of `CLAUDE.md`.

---

## Source 2: tiny-ror/luisa-checklist.md

# Message to Luisa: WhatsApp checklist and interview questions

*Draft, 2026-11-08. Not sent. Jesse sends it himself on WhatsApp as two messages. WhatsApp formatting: `*bold*`. Later this list moves into an onboarding portal (like Bitcoin Success School's), built in its own session.*

---

## Message 1: the to-do list

```
Hi Luisa! 🦁 Tiny ROR is moving. I've planned the whole launch: we're aiming to fill your first Ballina group of 10 for Term 1 next year, with $20 taster classes in the January holidays.

Here's everything I need from you, all in one list. Tick them off as you go and just reply with the numbers you've done.

*THIS WEEK*
1. Pick a time to meet me this week (about an hour) to go through all this
2. Record your interview (questions coming in my next message). About 45 min, voice memo or video

*MUST-HAVES BEFORE WE LAUNCH*
3. Venue: name, address, parking, toilets
4. Class day, time and how long a class runs
5. Your Working With Children Check number
6. Public liability insurance that covers kids' group classes
7. Your ABN (and is the business name ROR The Journey?)
8. Child safe policy (I'll draft it, you check it)
9. Photo and video consent form for parents (I'll draft it, you check it)
10. About 5 dates in the January holidays for taster classes
11. Your rules for refunds, missed classes and sick days

*THE OFFER*
12. Do parents stay in the room, or drop off?
13. Your real tool names: at least the first 4, ideally all 16 for the year
14. Happy with these prices? $40 single class, $280 a term (or 4 payments of $70), $20 taster that comes off the term
15. Names of 5 to 8 local parents with kids aged 4 to 6 who'd have a 15 min chat with me

*ACCOUNTS TO SET UP*
16. Domain name: I suggest tinyror.com.au (needs your ABN). Let's buy it together
17. Instagram and Facebook pages for Tiny ROR (send me the links, or we set them up when we meet)
18. Your own Stripe account for payments. Set it up yourself, and never send me passwords
19. Meta Business account (for the ads), then add me as a partner
20. A Google account for Tiny ROR (for Google ads and your business listing)

*PHOTOS*
21. 2 or 3 families with kids aged 4 to 6 for a fun 1-hour play photo shoot in early December (they'll sign a consent form)
22. A few good photos of you, ideally laughing

No need to do it all at once. If we meet this week and you get the interview done, plus 3 to 11, we're on track. Big ror! 💛
```

---

## Message 2: interview questions

```
*Tiny ROR interview* 🎙️
Record yourself answering these, about 45 min in total. Voice memo is fine, video is even better. Talk the way you'd talk to a parent. Stories are gold. Skip any you don't want to answer.

*YOU AND WHY*
1. What happened in your own life that led you to counselling?
2. When did you first think, "kids this little need this"? Tell me about that moment.
3. What does ROR (Raw, Open, Ready) mean to you?
4. What do you wish you'd known when your boys were 4 to 6?

*THE PARENTS YOU'RE FOR*
5. Describe the parent who walks in your door. What's their week like?
6. What do parents say to you when they're at the end of their rope? Their actual words.
7. What have they usually tried already that hasn't worked?
8. What are parents scared of, or embarrassed about, when it comes to their child's big feelings?
9. What do they want to feel by the end of a term?

*THE KIDS*
10. Tell me about a "spicy" child, a "sparkly" child, an "energy bunny" and a quiet one. How does each one show big feelings?
11. What does a shy child need on their first day?
12. What's a moment with a child you'll never forget? (No names.)

*THE TOOLS AND THE CLASS*
13. Walk me through a class, from the moment they arrive to the moment they leave.
14. Pick 3 tools. For each one: what's it called, what's it for, and how would you explain it to a 4-year-old?
15. Why play, clay and paint, and not sitting down and talking?
16. Why two weeks per tool? Why a term at a time?
17. What goes in the take-home guide? What should a parent do with it?

*TRUST AND THE HARD QUESTIONS*
18. How is this different from therapy? When would you send a family somewhere else?
19. What would you say to a parent who thinks their child is "too much" for a group?
20. What can a parent honestly expect after one term? What won't change?
21. How do you keep kids safe and the room calm with 10 little ones?

*QUICK-FIRE*
22. Finish this: "Tiny ROR is for the parent who…"
23. Finish this: "Let them ror means…"
24. One thing a parent could try tonight with a big feeling. How would you teach it in 30 seconds?
25. Anything I haven't asked that parents should know?

Send me the recording when it's done 🙏
```

*When the recording comes back: transcribe with Whisper (see `~/Master/CLAUDE.md`), file the text in `tiny-ror/notes/YYYY-MM-DD-luisa-interview.md`, keep the audio in `~/Master/Archive/videos/rorthejourney/`.*
