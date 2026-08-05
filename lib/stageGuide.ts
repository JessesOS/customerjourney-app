import type { ClientType } from "@/lib/journeyEngine";

/**
 * Per-stage voice-guide scripts (Imprint-style breathing orb + narration).
 * The caption bubble shows this exact text while the audio plays, so script
 * and audio must be regenerated together — see scripts/generate-voice.sh.
 * Audio files live in public/portal/voice/{scale|respond}-{stageId}.m4a and
 * are placeholder macOS TTS (Karen, en_AU) until a branded voice replaces
 * them — swapping the files requires no code change.
 */
export type StageGuide = { script: string; audioSrc: string };

const scaleScripts: Record<string, string> = {
  onboarding:
    "Welcome aboard — great to have you. This first stage is about getting the essentials from you: your business details, account access, and branding. Work through the tasks at your own pace, and we'll take it from there.",
  build:
    "This is where we get to work. Behind the scenes we're building your campaigns, your creative, and your AI receptionist. You'll see a few approvals land here — that's your chance to shape anything before it goes live.",
  testing:
    "Nearly there. This stage is one big dress rehearsal — you'll take a live test call from your AI receptionist and make sure everything feels right before launch.",
  "go-live":
    "It's launch day. Your campaigns switch on and real enquiries start flowing in. We'll walk your team through everything, and we're watching closely from our side.",
  "post-launch":
    "You're live — nice work getting here. From now on it's about performance: we review the numbers, tune what's working, and stay in your corner. Anything you need, we're one message away.",
};

const respondScripts: Record<string, string> = {
  onboarding:
    "Welcome aboard — great to have you. This first stage is about the essentials: your business details and access, so we can set up your AI receptionist. Work through the tasks at your own pace.",
  testing:
    "We're setting up your AI receptionist and CRM behind the scenes. The main event here is a live test call — you'll hear it in action before a single customer does.",
  "go-live":
    "It's launch day. Your AI receptionist switches on and starts catching every call. We'll walk your team through everything.",
  "post-launch":
    "You're live — nice work getting here. From here we keep an eye on things, fine-tune, and stay in your corner. Anything you need, we're one message away.",
};

export function stageGuideFor(clientType: ClientType, stageId: string): StageGuide | undefined {
  const isRespond = clientType === "respond";
  const script = (isRespond ? respondScripts : scaleScripts)[stageId];
  if (!script) return undefined;
  return {
    script,
    audioSrc: `/portal/voice/${isRespond ? "respond" : "scale"}-${stageId}.m4a`,
  };
}
