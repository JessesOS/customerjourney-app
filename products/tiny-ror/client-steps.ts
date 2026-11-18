// Tiny ROR (Luisa): the client's side. 33 steps in five stages, from
// spec.md (Luisa's 22-item checklist, plus a bookmark step). Jesse OK'd the
// list on 2026-11-08. 2026-11-19 (Jesse): access steps added (Wix, Porkbun,
// Google listing, contact details, brand files) and wording brought in line
// with the plan board of 16 Nov. Wording by Claude, approved by Jesse 2026-11-19.
// 2026-11-19, later (draft, staging only until Jesse approves): reordered so the
// accounts with a wait come first, Meta split into phone-sized steps, and two
// approval steps added (quiz, ads). She can open any step in any order.
//
// Wording by Claude, approved with the go-live (Jesse, 2026-11-09).
// Rules from the spec: step 1 is the meeting with Jesse. Jesse drafts the
// child safe policy and the consent form; Luisa checks them. Stripe, Meta and
// Google she sets up herself: never ask for a password or a key.
// Brand: "ror", never "roar". No outcome promises.

import type { StagePatch } from "../custom";
import type { ClientStep, StageId } from "../types";

const FILES = { choose: "Click to choose your files", chooseMore: "+ Add more files", stayOpen: true } as const;
/** The address Luisa invites as a helper (Jesse, 2026-11-19). */
const INVITE = "jesse@allconvos.ai";
const NO_PASSWORDS = "Never send me a password, a key or a bank login. Not here, not on WhatsApp. You set this up yourself and keep the logins to yourself.";

// Voice mode, not dictation (Jesse, 2026-11-19): the sound-wave button beside the microphone,
// on the phone apps. Claude's help page says the words of a voice chat are saved in the chat.
const INTERVIEW_QUESTIONS = [
  "Open the Claude app on your phone and start a new chat. Paste in the message I sent you on WhatsApp, and send it.",
  "Tap the voice button: the little sound-wave next to the microphone, in the box where you type. Say hello. Claude talks back and asks the first question.",
  "At the end, Claude asks you to close voice mode and type: write it out. It then writes the whole interview down. Tap Share and paste the link below.",
  "YOU AND WHY. 1. What happened in your own life that led you to counselling? 2. When did you first think, \"kids this little need this\"? Tell me about that moment. 3. What does ROR (Raw, Open, Ready) mean to you? 4. What do you wish you'd known when your boys were 4 to 6?",
  "THE PARENTS YOU'RE FOR. 5. Describe the parent who walks in your door. What's their week like? 6. What do parents say to you when they're at the end of their rope? Their actual words. 7. What have they usually tried already that hasn't worked? 8. What are parents scared of, or embarrassed about, when it comes to their child's big feelings? 9. What do they want to feel by the end of a term?",
  "THE KIDS. 10. Tell me about a \"spicy\" child, a \"sparkly\" child, an \"energy bunny\" and a quiet one. How does each one show big feelings? 11. What does a shy child need on their first day? 12. What's a moment with a child you'll never forget? (No names.)",
  "THE TOOLS AND THE CLASS. 13. Walk me through a class, from the moment they arrive to the moment they leave. 14. Pick 3 tools. For each one: what's it called, what's it for, and how would you explain it to a 4-year-old? 15. Why play, clay and paint, and not sitting down and talking? 16. Why two weeks per tool? Why a term at a time? 17. What goes in the take-home guide? What should a parent do with it?",
  "TRUST AND THE HARD QUESTIONS. 18. How is this different from therapy? When would you send a family somewhere else? 19. What would you say to a parent who thinks their child is \"too much\" for a group? 20. What can a parent honestly expect after one term? What won't change? 21. How do you keep kids safe and the room calm with 10 little ones?",
  "QUICK-FIRE. 22. Finish this: \"Tiny ROR is for the parent who…\" 23. Finish this: \"Let them ror means…\" 24. One thing a parent could try tonight with a big feeling. How would you teach it in 30 seconds? 25. Anything I haven't asked that parents should know?",
];

export const tinyRorStages: Partial<Record<StageId, StagePatch>> = {
  // Day 1 is her start date (23 Nov 2026 on prod). Ads are planned for 9 Dec (day 17);
  // the go or no-go check is 2 Dec (day 10). Order and days come from the schedule in
  // ~/Master/Side_Projects/Clients/rorthejourney/tiny-ror/notes/2026-11-19-launch-access-schedule.md.
  onboarding: {
    name: "Start here",
    dayStart: 1,
    dayEnd: 3,
    blurb: "Book a time with me and do your interview with Claude. Those two get everything else moving.",
    statusNotes: [],
  },
  build: {
    name: "Accounts and access",
    dayStart: 1,
    dayEnd: 7,
    blurb: "These come first because some of them have a wait built in. You own every account, in your name. You add me as a helper and I do the fiddly parts. Never send me a password.",
    statusNotes: [],
  },
  testing: {
    name: "Must-haves before we launch",
    dayStart: 1,
    dayEnd: 10,
    blurb: "The details nothing can launch without: your venue, your checks and insurance, and the policies parents will ask about. I draft the child safe policy and the consent form. You check them.",
    statusNotes: [],
  },
  "go-live": {
    name: "The offer and your approvals",
    dayStart: 3,
    dayEnd: 14,
    blurb: "How your classes work, the prices, a few local parents I can talk to, and your yes on the quiz and the ads. Nothing goes out in your name without it.",
    statusNotes: [],
  },
  "post-launch": {
    name: "Photos, and later",
    dayStart: 5,
    dayEnd: 30,
    blurb: "You first, then real families, each with a signed consent form. And one job that waits until after launch.",
    statusNotes: [],
  },
};

export const tinyRorSteps: { stage: StageId; step: ClientStep }[] = [
  // ── Start here ──
  {
    stage: "onboarding",
    step: {
      // PLACEHOLDER link: Jesse's AT kickoff booking page (45 min) until he makes a
      // one-hour Tiny ROR page. Swap it before prod.
      id: "tror-book",
      bookingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1zFdYaXgf5lDqGZ8rLV9KPdB1nNec8ZbfcHcmXT7Bj51LstiAWeQvjG-26D1PxlPcvQ9-lxgdP",
      title: "Book a time with me this week",
      detail: "About an hour, to go through this whole list together. Pick any time this week that suits you.",
      steps: [
        "Pick a time on the booking page below. You get a calendar invite straight away.",
        "Bring anything you already have: your ABN, your Working With Children Check, your insurance.",
      ],
      notePrompt: "Anything you want to cover when we meet? (optional)",
      doneLabel: "I've booked it",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "tror-interview",
      // She does the interview with Claude, on her own (Jesse, 2026-11-19). The message she
      // pastes in is tiny-ror/luisa-interview-prompt.md; Jesse sends it on WhatsApp.
      title: "Your interview with Claude",
      detail: "About an hour, whenever suits you, out loud. It's a spoken chat with Claude, like a phone call: it asks one question at a time, and you just talk. Stories are gold. Say \"skip\" for anything you don't want to answer. How to start is below, then the questions, so you can think ahead. Your words become the website, the ads and the posts.",
      steps: INTERVIEW_QUESTIONS,
      hasUpload: true,
      uploadOptions: { accept: ".txt,.md,.pdf,.doc,.docx,.m4a,.mp3,.wav,.mp4,.mov,.zip", title: "Upload the interview", hint: "Only if you saved the interview as a file. The Share link below is easier.", ...FILES },
      notePrompt: "Or paste the link Claude gives you when you tap Share",
      notePlaceholder: "https://claude.ai/share/...",
      doneLabel: "I've sent it",
    },
  },
  {
    stage: "onboarding",
    step: {
      id: "tror-bookmark",
      title: "Bookmark your portal",
      detail: "This portal is where your Tiny ROR to-do list lives. Bookmark it so you can always get back here.",
      showPortalLink: true,
      steps: [
        "Press Cmd + D on a Mac (Ctrl + D on Windows) while you're on this page.",
        "On your phone, copy your portal link above and save it somewhere handy.",
      ],
      doneLabel: "I've bookmarked it",
      clientOnly: true,
    },
  },
  // ── Accounts and access (the slow ones, so they come first) ──
  {
    stage: "build",
    step: {
      id: "tror-abn",
      title: "Your ABN and business name",
      detail: "Your ABN, and the name the business trades under. Is it ROR The Journey? You need the ABN for the domain name too.",
      notePrompt: "Your ABN and the business name",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      // Meta lists two-factor authentication as a prerequisite for giving a partner access.
      id: "tror-fb-2step",
      title: "Turn on two-step login on Facebook",
      detail: "Two-step login means Facebook asks for a code from your phone as well as your password. Meta needs it on before you can add me to anything. Two minutes, in the Facebook app.",
      steps: [
        "Open the Facebook app and tap the menu, then Settings & privacy, then Settings.",
        "Tap Accounts Centre, then Password and security, then Two-factor authentication.",
        "Choose your Facebook account, pick text message or an app, and follow the prompts.",
      ],
      notePrompt: "Stuck, or can't find it on your phone? Tell me where (optional)",
      doneLabel: "It's on",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-meta-account",
      title: "Open your Meta business account",
      detail: "Meta is the company behind Facebook and Instagram. A business account is the folder your Facebook page, your Instagram and your ads sit in. It's free, and it's in your name. Open it this week: ads from a brand-new account start with a low daily limit that only lifts with time.",
      steps: [
        "Go to business.facebook.com and log in with your own Facebook.",
        "Press Create an account. Use the business name, your name and your email.",
        "Confirm the email Meta sends you.",
      ],
      important: NO_PASSWORDS,
      notePrompt: "Stuck, or can't find it on your phone? Tell me where (optional)",
      doneLabel: "I've opened it",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-meta",
      title: "Add me as a partner on Meta",
      detail: "One partner request lets me post, and make and run your ads, from my own login. Everything stays in your account, in your name. I do the fiddly set-up after this: the ad account, linking your page and Instagram, and the tracking. You approve every ad.",
      steps: [
        "In business.facebook.com, open Settings, then Users, then Partners.",
        "Press Add, then \"Give a partner access to your assets\".",
        "Type my Business ID. I'll message it to you.",
        "Tick everything it offers (your page, your Instagram, your ad account), choose full control, then press Assign assets.",
      ],
      important: NO_PASSWORDS,
      notePrompt: "Stuck, or can't find it on your phone? Tell me where and we'll do it on a call (optional)",
      doneLabel: "I've added you",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-meta-card",
      title: "Add your card for the ads",
      detail: "The ads are paid for on your own card, so the spend is always yours to see and stop. I'll tell you when the ad account is ready. Meta may take a small test payment and give it back. Nothing is spent on ads until you say go, and I set a daily cap first.",
      steps: [
        "In business.facebook.com, open Billing and payments.",
        "Choose the Tiny ROR ad account, then Add payment method.",
        "Add your card. If it asks about tax, enter your ABN.",
      ],
      important: NO_PASSWORDS,
      notePrompt: "Stuck, or can't find it on your phone? Tell me where (optional)",
      doneLabel: "I've added it",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-socials",
      title: "Your Tiny ROR Instagram and Facebook page",
      detail: "A fresh Tiny ROR Instagram, just for families from Byron Bay to Ballina, and a Facebook page. We open them together, about ten minutes. The Instagram needs to be a professional account, joined to the Facebook page, so ads can run on both. If you're happy for me to reuse posts from your ROR The Journey pages, paste those links too.",
      steps: [
        "In the Instagram app, open Settings, then Account type and tools, and switch to a professional account. Choose Business.",
        "Still in Instagram, tap Edit profile, then Page, and connect your Tiny ROR Facebook page.",
        "Paste both links in the box below.",
      ],
      notePrompt: "Your Instagram and Facebook links",
      notePlaceholder: "https://instagram.com/...",
      doneLabel: "Done",
    },
  },
  {
    stage: "build",
    step: {
      // Replaces tror-porkbun (settings changed on a call): she is moving her web
      // address and hosting from Wix to Porkbun (Jesse, 2026-11-19).
      id: "tror-porkbun-account",
      title: "Open your own Porkbun account",
      detail: "Porkbun is where your web addresses and your website will live from now on. Open an account at porkbun.com, in your name, with your own email and card. It's yours. I never log in to it.",
      steps: [
        "Go to porkbun.com and create an account.",
        "Turn on two-step login when it offers it.",
      ],
      important: NO_PASSWORDS,
      doneLabel: "I've opened it",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-domain",
      title: "Buy your new Tiny ROR web address",
      detail: "A new web address just for Tiny ROR. I suggest tinyror.com.au. A .com.au needs your ABN. We buy it together, in your Porkbun account, so it's in your name. I do the technical set-up after that.",
      notePrompt: "Another name you'd prefer? (optional)",
      doneLabel: "We've bought it",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-stripe",
      title: "Your own Stripe account",
      detail: "Stripe takes the parents' payments and pays them straight into your bank account. Set it up yourself at stripe.com, in the business name. Have your ABN, your licence or passport, a bill or statement with your home address, and your bank details ready. Stripe checks them, usually within a day. Later you connect it to the booking page yourself, with me on a call.",
      important: NO_PASSWORDS,
      doneLabel: "I've set it up",
    },
  },
  {
    stage: "build",
    step: {
      // Replaces tror-google (a new Google account for ads): the plan is a free listing, no Google Ads (16 Nov).
      id: "tror-google-listing",
      title: "Add me to your Google listing",
      detail: "Your Google Business Profile is how you show on the map in Ballina. It's free. Add me as a manager, so I can check it and fill it in. If you don't have a listing yet, tell me in the box and we'll make one together.",
      steps: [
        "Signed in to Google, search for your business name.",
        "On your listing, press the three dots, then Business Profile settings.",
        "Choose People and access, then Add.",
        "Type " + INVITE + ", choose Manager, and send the invite.",
      ],
      important: NO_PASSWORDS,
      notePrompt: "No listing yet, or not sure? Tell me here (optional)",
      doneLabel: "I've added you",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-wix",
      title: "Add me to your Wix site",
      detail: "Your current website and its web address live at Wix. We're moving both to Porkbun. Invite me to your Wix site, so I can copy the site across. You invite me from inside Wix. I never need your login.",
      steps: [
        "Log in to Wix and open your site's dashboard.",
        "Go to Settings, then Roles & Permissions.",
        "Press Invite People, and type " + INVITE + ".",
        "Choose the Admin role, then send the invite.",
      ],
      important: NO_PASSWORDS,
      doneLabel: "I've invited you",
    },
  },
  {
    stage: "build",
    step: {
      id: "tror-contact",
      title: "The phone and email parents will see",
      detail: "The mobile number parents can message on WhatsApp, and the email address that replies come back to. They go on the website and on every message sent in your name.",
      notePrompt: "The mobile number and the email address",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  // ── Must-haves before we launch ──
  {
    stage: "testing",
    step: {
      id: "tror-venue",
      title: "Your venue",
      detail: "Where the Ballina classes and the tasters will run. Parents will want to know before they book.",
      notePrompt: "Venue name, address, parking and toilets",
      notePlaceholder: "Name, street address, where parents park, where the toilets are",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-class-time",
      title: "Class day, time and length",
      detail: "Which day and time the term classes run, and how long one class lasts.",
      notePrompt: "Day, time and how long a class runs",
      notePlaceholder: "e.g. Tuesdays, 3.30 pm, 60 minutes",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-wwcc",
      title: "Your Working With Children Check",
      detail: "Your WWCC number goes on the website. Parents look for it.",
      notePrompt: "Your WWCC number",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-insurance",
      title: "Public liability insurance",
      detail: "Insurance that covers group classes for children. Upload the certificate, or tell me where it's up to if it's still on its way.",
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.png,.jpg,.jpeg,.heic", title: "Upload your certificate", hint: "A PDF or a photo of it.", ...FILES },
      notePrompt: "Insurer, or where it's up to (optional)",
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-child-safe",
      title: "Check your child safe policy",
      detail: "I'll draft it and put it below. Read it. If it's right, press the button. If something needs to change, write it in the box.",
      hasEditableContent: true,
      pendingContentText: "Your child safe policy appears here once I've drafted it.",
      notePrompt: "Anything to change? (optional)",
      doneLabel: "Looks right",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-consent",
      title: "Check the photo and video consent form",
      detail: "The form every parent signs before their child is in a photo or a video. I'll draft it and put it below. Read it, and tell me anything to change.",
      hasEditableContent: true,
      pendingContentText: "Your consent form appears here once I've drafted it.",
      notePrompt: "Anything to change? (optional)",
      doneLabel: "Looks right",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-taster-dates",
      title: "Taster dates in the January holidays",
      detail: "About 5 dates for the $20 taster classes, in the January school holidays.",
      notePrompt: "Your taster dates and times",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "testing",
    step: {
      id: "tror-policies",
      title: "Refunds, missed classes and sick days",
      detail: "Your rules, in your words. I'll turn them into a short policy for the website and the booking page.",
      notePrompt: "What happens with refunds, missed classes and sick days",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  // ── The offer and your approvals ──
  {
    stage: "go-live",
    step: {
      id: "tror-parents-stay",
      title: "Do parents stay or drop off?",
      detail: "Do parents stay in the room during class, or drop off and come back?",
      notePrompt: "Stay, drop off, or a bit of both",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-tools",
      title: "Are your tool names final?",
      detail: "These are the 16 tool names on your site. If they're right, press the button. If any have changed, write the new names in the box.",
      steps: [
        "Term 1, Know Me: Feelings Faces, Body Weather, Big and Small, My Words.",
        "Term 2, Calm Me: Belly Balloon, Squish and Release, Calm Corner, Reset Button.",
        "Term 3, Love Me: Uniquely Me, Kind Inner Voice, Celebrate Each Other, Try Again.",
        "Term 4, Kind and Brave: Kind Hands, Fix It, Brave and True, Our Circle.",
      ],
      hasUpload: true,
      uploadOptions: { accept: ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.heic", title: "Your Tool Library (optional)", hint: "A document, or photos of your notes, if it helps.", ...FILES },
      notePrompt: "Any names to change? (optional)",
      doneLabel: "They're final",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-prices",
      title: "Happy with these prices?",
      detail: "$40 for a single class. $280 for a term, or 4 payments of $70. A $20 taster that comes off the term.",
      notePrompt: "Anything you'd change? (optional)",
      doneLabel: "I'm happy with these",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-parent-chats",
      title: "Local parents I can talk to",
      detail: "Names of 5 to 8 local parents with kids aged 4 to 6 who'd have a 15-minute chat with me. Ask them first. What they say shapes the website and the ads.",
      notePrompt: "Their names, and a mobile or email for each",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-quiz-approve",
      title: "Approve the quiz and the messages",
      detail: "The \"ror style\" quiz, its four results, and the emails and texts that follow. They go out in your name, so they need to sound like you. I'll put them below when they're ready. Read them, and tell me anything to change.",
      hasEditableContent: true,
      pendingContentText: "The quiz and the messages appear here when they're ready for you.",
      notePrompt: "Anything to change? (optional)",
      doneLabel: "They sound like me",
    },
  },
  {
    stage: "go-live",
    step: {
      id: "tror-ads-approve",
      title: "Approve the ads",
      detail: "The four ads, before anything is switched on. No ad runs without your yes. No child's face is in any of them. I'll put them below when they're ready.",
      hasEditableContent: true,
      pendingContentText: "Your ads appear here when they're ready for you.",
      notePrompt: "Anything to change? (optional)",
      doneLabel: "Yes, run them",
    },
  },
  // ── Photos, and later ──
  {
    stage: "post-launch",
    step: {
      id: "tror-photos-luisa",
      title: "Photos of you",
      detail: "A few good photos of you, ideally laughing. For the About section of the website, and the first ads. Just you, please: no children in these.",
      hasUpload: true,
      uploadOptions: { accept: ".png,.jpg,.jpeg,.webp,.heic,.zip", title: "Upload your photos", hint: "As many as you like. A zip is fine.", ...FILES },
      doneLabel: "Done",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "tror-shoot-families",
      title: "Families for the photo shoot",
      detail: "2 or 3 families with kids aged 4 to 6 for a fun 1-hour play photo shoot in early December. Each family signs the consent form first.",
      notePrompt: "The families' names, and a mobile for each",
      noteRequired: true,
      doneLabel: "Done",
    },
  },
  {
    stage: "post-launch",
    step: {
      id: "tror-brand-files",
      optional: true,
      title: "Your logo and brand files",
      detail: "The Tiny ROR logo files and anything else from your designer: fonts, colours, stickers. If you don't have them, skip this. I can lift them from your site.",
      hasUpload: true,
      uploadOptions: { accept: ".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps,.zip", title: "Upload your files", hint: "A zip is fine. Or paste a link below.", ...FILES },
      notePrompt: "Or paste a link (optional)",
      doneLabel: "Done",
    },
  },
  {
    stage: "post-launch",
    step: {
      // Not needed for launch (the new site runs on the new web address). Wix says the
      // Wix site disconnects once the address leaves, and email records must be re-added.
      id: "tror-domain-move",
      title: "Later: move your old web address from Wix to Porkbun",
      detail: "This one can wait until after launch. Nothing in the launch depends on it. We do it together on a call, about 15 minutes: you log in to Wix and to Porkbun, and I tell you what to click. The move takes up to a week. I set up your email and your pages at Porkbun first, so nothing goes dark. Don't start it on your own.",
      steps: [
        "In Wix, we ask for the transfer code. Wix emails it to you.",
        "In Porkbun, we start the transfer with that code. Porkbun may charge a small fee, on your card.",
        "Then we wait for it to land. I check your website and email still work.",
      ],
      important: NO_PASSWORDS,
      notePrompt: "Which web address is at Wix?",
      notePlaceholder: "e.g. rorthejourney.com.au",
      doneLabel: "It's moved",
    },
  },
];
