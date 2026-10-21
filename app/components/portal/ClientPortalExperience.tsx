"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { JourneyMilestone, PortalJourney, UploadOptions } from "@/lib/journeyTypes";
import {
  askItemsOf,
  buildStages,
  headerName,
  hubBrand,
  interviewAudioBase,
  showsLandingPreview,
  showsPlayground,
  showsTaskBooking,
  showsTaskImportant,
  showsTaskVideo,
  stageCompletedBy as stageCompletedByStep,
  stageGuideOf,
  taskNote,
} from "@/lib/journeyBuild";
import { formSizeLabel, onboardingFormById } from "@/lib/onboardingForm";
import { OnboardingFormStepper } from "@/app/components/portal/OnboardingFormStepper";
import { MicButton } from "@/app/components/portal/MicButton";
import { IntroVideo, type IntroVideoHandle } from "@/app/components/portal/IntroVideo";
import { VoiceInterview } from "@/app/components/portal/VoiceInterview";
import { PortalAssistant } from "@/app/components/portal/PortalAssistant";
import { PortalComms } from "@/app/components/portal/PortalComms";
import { AgreementAccept } from "@/app/components/portal/AgreementAccept";
import { JourneyMap } from "@/app/components/portal/JourneyMap";
import { ReceptionistPlayground } from "@/app/components/portal/ReceptionistPlayground";
import { RailVariant, StageRail } from "@/app/components/portal/StageRail";
import { StageGuide } from "@/app/components/portal/StageGuide";
import { AskChips } from "@/app/components/portal/AskChips";
import { WelcomeScreen } from "@/app/components/portal/WelcomeScreen";
import { WelcomeMarquee } from "@/app/components/portal/WelcomeMarquee";
import { WelcomeFunnel } from "@/app/components/portal/WelcomeFunnel";
import { HandoffHub } from "@/app/components/portal/HandoffHub";
import { CobaltHub } from "@/app/components/portal/CobaltHub";
import { AuroraHub } from "@/app/components/portal/AuroraHub";
import { GroveHub } from "@/app/components/portal/GroveHub";
import { WelcomeAurora } from "@/app/components/portal/WelcomeAurora";
import { IncentiveModal } from "@/app/components/portal/IncentiveModal";
import { TaskRow } from "@/app/components/portal/TaskRow";
import { UpNextCard } from "@/app/components/portal/UpNextCard";
import { StageCompleteView } from "@/app/components/portal/StageCompleteView";
import { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

type View = "home" | "stage" | "complete";

export type UploadMeta = { id?: number; fileName: string; uploadedAt: string };

export type ClientPortalExperienceProps = {
  name?: string;
  /** Everything this client's product shows (steps, wording, days, branding,
      guides): built on the server by lib/productRegistry.ts (portalJourneyFor). */
  journey: PortalJourney;
  currentDay: number;
  /** Days since the start, not capped at the journey length (String Theory's Today line). */
  calendarDay?: number;
  initialCompletedMilestoneIds: string[];
  initialMilestoneNotes?: Record<string, string>;
  milestoneContent?: Record<string, string>;
  milestoneUploads?: Record<string, UploadMeta[]>;
  portalToken?: string;
  // "cobalt" is the motion-redesign look. It is a review option only: nothing stores it yet.
  themeVariant?: "warm" | "cool" | "neutral" | "handoff" | "cobalt" | "aurora" | "calm" | "grove" | "groveaurora";
};

function CheckIcon({ color = "var(--pj-ink)", size = 13 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4 10-12" />
    </svg>
  );
}

function LinkifiedLine({ line }: { line: string }) {
  const parts = line.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: "var(--pj-link)", textDecoration: "underline" }}>
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function PlayIcon({ color = "var(--pj-act)", fill }: { color?: string; fill?: string }) {
  return (
    <span style={{ width: 30, height: 30, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={fill ?? "var(--pj-act-ink)"}>
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

// "Bookmark your portal link" — shows the client's own portal URL with a
// one-tap copy, so they always know where to find their journey again.
function PortalLinkCard({ portalToken }: { portalToken?: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.origin + (portalToken ? `/portal/${portalToken}` : window.location.pathname));
  }, [portalToken]);

  return (
    <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 22 }}>
      <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 12 }}>
        Your portal link
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--pj-well)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-sm)", padding: "12px 14px" }}>
        <span style={{ flex: 1, fontSize: 13.5, color: "var(--pj-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url || "…"}</span>
        <button
          type="button"
          onClick={() => {
            if (!url || !navigator.clipboard) return;
            navigator.clipboard.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          style={{ flexShrink: 0, background: copied ? "var(--pj-done)" : "var(--pj-act)", color: "#fff", border: "none", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "var(--font-body), sans-serif" }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--pj-faint)", margin: "14px 0 0" }}>
        Save it to your bookmarks, or add it to your phone&apos;s home screen for one-tap access.
      </p>
    </div>
  );
}

export function ClientPortalExperience({
  name = "Chris",
  journey,
  currentDay,
  calendarDay,
  initialCompletedMilestoneIds,
  initialMilestoneNotes = {},
  milestoneContent = {},
  milestoneUploads = {},
  portalToken,
  themeVariant = "warm",
}: ClientPortalExperienceProps) {
  const [view, setView] = useState<View>("home");
  const [justCompletedStageId, setJustCompletedStageId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(initialCompletedMilestoneIds));
  const [notes, setNotes] = useState<Record<string, string>>(initialMilestoneNotes);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  // A step with both a form and a voice interview lets the client choose: type or talk.
  const [answerModes, setAnswerModes] = useState<Record<string, "type" | "talk">>({});
  const [uploads, setUploads] = useState<Record<string, UploadMeta[]>>(milestoneUploads);
  // Team content can land minutes AFTER the client first opens the portal (the
  // AI pack generates during checkout). Start from the server-rendered snapshot
  // and poll for fresh content while any of it is still empty, so "your team is
  // finalizing these" resolves into real content without a manual refresh.
  const [liveContent, setLiveContent] = useState<Record<string, string>>(milestoneContent);
  useEffect(() => {
    if (!portalToken) return;
    let cancelled = false;
    let ticks = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/api/portal/${portalToken}/milestone-content`, { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; content?: Record<string, string> };
        if (!cancelled && data.ok && data.content) setLiveContent((prev) => ({ ...prev, ...data.content }));
      } catch {}
    };
    const interval = setInterval(() => {
      ticks += 1;
      if (ticks > 40) { clearInterval(interval); return; } // ~20 min, then stop
      void poll();
    }, 30000);
    void poll();
    return () => { cancelled = true; clearInterval(interval); };
  }, [portalToken]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // The name the client sees: a custom product's own name, else the product's wordmark.
  const brandName = journey.brandName;
  const brandTagline = journey.tagline;
  // A product's intro video plays after the welcome, then the journey page.
  const introVideo = journey.introVideo;
  const introRef = useRef<IntroVideoHandle | null>(null);
  const [introPlaying, setIntroPlaying] = useState(false);

  const journeyStages = useMemo(
    () => buildStages(journey.stages, completedIds, currentDay),
    [journey, completedIds, currentDay],
  );

  const defaultStage = useMemo(() => journeyStages.find((s) => s.status === "current"), [journeyStages]);
  const defaultMilestoneIndex = defaultStage
    ? Math.max(0, defaultStage.milestones.findIndex((m) => m.status !== "done")) + 1
    : 1;

  const [milestone, setMilestone] = useState(defaultMilestoneIndex);
  const [viewingStageId, setViewingStageId] = useState<string>(defaultStage?.id ?? journeyStages[0].id);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  // Stage task list is collapsed by default — the hero card is the one action
  // on the page; the list is orientation detail, one click away.
  const [tasksOpen, setTasksOpen] = useState(false);
  // Journey-card treatment under review. The floating toggle that switches it
  // renders ONLY on /portal/demo (code-only route) — real clients never see it.
  const [railVariant, setRailVariant] = useState<RailVariant>("deepframe");
  // Portal layout: the handoff design defaults to its journey rail (Jesse
  // 2026-08-10 — clients like Rich should land on it with no toggling);
  // the current design keeps "focus" as its shipped default (2026-08-05).
  const [railLayout, setRailLayout] = useState<"rail" | "focus">(themeVariant === "warm" || themeVariant === "cool" || themeVariant === "neutral" ? "focus" : "rail");
  const [isDemo, setIsDemo] = useState(false);
  // Presentation switch (demo route): hides every review pill so the page can be
  // shown clean, and brings them back. Remembered in this browser.
  const [pillsOn, setPillsOn] = useState(true);
  useEffect(() => {
    try { if (window.localStorage.getItem("pjDemoPills") === "off") setPillsOn(false); } catch {}
  }, []);
  const togglePills = () => {
    setPillsOn((on) => {
      try { window.localStorage.setItem("pjDemoPills", on ? "off" : "on"); } catch {}
      return !on;
    });
  };
  const showPills = isDemo && pillsOn;
  // First-visit welcome landing (Imprint-style). Shown until dismissed once
  // on this device PER CLIENT (a global flag meant a second client on the same
  // browser never saw their welcome — caught testing 2026-08-10);
  // Tell admin the client opened their portal. Skipped in a browser signed in
  // to admin, so Jesse's own checks don't count as the client's visits.
  useEffect(() => {
    if (!portalToken) return;
    try { if (window.localStorage.getItem("scaleAdminToken")) return; } catch {}
    fetch(`/api/portal/${portalToken}/opened`, { method: "POST", keepalive: true }).catch(() => {});
  }, [portalToken]);

  // ?welcome=1 forces it back for review.
  const welcomedKey = `pjWelcomed:${portalToken ?? "demo"}`;
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeDecided, setWelcomeDecided] = useState(false);
  useEffect(() => {
    setIsDemo(window.location.pathname === "/portal/demo");
    try {
      const forced = new URLSearchParams(window.location.search).get("welcome") === "1";
      if (forced || localStorage.getItem(welcomedKey) !== "1") setShowWelcome(true);
    } catch {}
    setWelcomeDecided(true);
  }, [welcomedKey]);
  // Deep link: /portal/<token>?task=<milestoneId> opens that task directly, so a
  // reminder can drop the client exactly where they stopped instead of on the rail.
  useEffect(() => {
    try {
      const wanted = new URLSearchParams(window.location.search).get("task");
      if (!wanted) return;
      for (const stage of journeyStages) {
        const idx = stage.milestones.findIndex((m) => m.id === wanted);
        if (idx !== -1) {
          setViewingStageId(stage.id);
          setMilestone(idx + 1);
          setView("stage");
          return;
        }
      }
    } catch {}
    // journeyStages is stable for a given client/day; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lift the page's anti-flash veil only after the decision has rendered, so
  // the first visible paint is the welcome overlay (or the rail on a return
  // visit) — never a flash of one then the other.
  useEffect(() => {
    if (welcomeDecided) document.documentElement.removeAttribute("data-welcome-pending");
  }, [welcomeDecided]);
  function dismissWelcome() {
    try {
      localStorage.setItem(welcomedKey, "1");
    } catch {}
    setShowWelcome(false);
    // Fresh client, never seen it: the incentive popup takes the welcome's
    // slot immediately after — same per-client key pattern.
    try {
      if (localStorage.getItem(incentiveKey) !== "1") setShowIncentive(true);
    } catch {}
  }

  // "Move fast, save $200" engagement popup — one-time per client, shown the
  // instant the welcome dismisses. ?incentive=1 forces it back for review.
  const incentiveKey = `pjIncentiveSeen:${portalToken ?? "demo"}`;
  const [showIncentive, setShowIncentive] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("incentive") === "1") setShowIncentive(true);
    } catch {}
  }, []);
  function dismissIncentive() {
    try {
      localStorage.setItem(incentiveKey, "1");
    } catch {}
    setShowIncentive(false);
  }

  // Jesse 2026-08-10: "Get started" lands on the onboarding OVERVIEW (the
  // journey page with Up Next / Start this task), NOT straight into the form.
  // The overview is the orientation moment; the client chooses to start.
  // Portal look: warm (organic) / cool (slate workshop). Seeded from the client
  // record; the topbar switcher flips it instantly and persists the choice back
  // to the record so it follows the client across devices. Same link always.
  const [theme, setTheme] = useState<"warm" | "cool" | "neutral">(themeVariant === "warm" || themeVariant === "cool" || themeVariant === "neutral" ? themeVariant : "warm");
  // Neutral's accent audition (demo pill): gallery surfaces stay, one accent
  // carries the life. Terracotta is the recommended default everywhere.
  const [neutralAccent, setNeutralAccent] = useState<"terracotta" | "brass" | "indigo" | "graphite">("terracotta");
  // Welcome screen generation under review: "funnel" (motion redesign, drawn in
  // code; the default on the motion-redesign branch), "marquee" (trade tiles)
  // and "mosaic" (the first static tiles). Demo pill switches live.
  const [welcomeVersion, setWelcomeVersion] = useState<"funnel" | "aurora" | "marquee" | "mosaic">(themeVariant === "aurora" || themeVariant === "calm" ? "aurora" : "funnel");
  // Whole-portal design skin from the client_portal handoff package (DM fonts,
  // terracotta+teal on near-white). Demo review toggle; skin-level only.
  const [designSkin, setDesignSkin] = useState<"current" | "handoff" | "cobalt" | "aurora" | "calm" | "grove" | "groveaurora">(themeVariant === "warm" || themeVariant === "cool" || themeVariant === "neutral" ? "current" : themeVariant);
  // The handoff design's own Light|Dark scheme (its README ships both); it
  // replaces the warm/cool/neutral dots while the handoff skin is active.
  const [handoffScheme, setHandoffScheme] = useState<"light" | "dark">("light");
  // Voice guide on/off — device-level preference (localStorage), defaults on.
  // Off unmounts the orb entirely, which also stops any playing narration.
  const [voiceOn, setVoiceOn] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("pjVoiceOff") === "1") setVoiceOn(false);
    } catch {}
  }, []);
  function toggleVoice() {
    setVoiceOn((on) => {
      try {
        localStorage.setItem("pjVoiceOff", on ? "1" : "0");
      } catch {}
      return !on;
    });
  }
  function switchTheme(next: "warm" | "cool" | "neutral") {
    if (next === theme) return;
    setTheme(next);
    if (portalToken) {
      fetch(`/api/portal/${portalToken}/theme`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeVariant: next }),
      }).catch(() => {});
    }
  }

  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Overall progress is the share of the client's tasks that are done, so a
  // finished journey reads 100% (Jesse, 2026-10-16: it counted days, and a
  // fully ticked journey on day 1 read 3%). Same count as the Progress view.
  const allTasks = journeyStages.flatMap((s) => s.milestones);
  const progress = allTasks.length ? Math.round((allTasks.filter((m) => m.status === "done").length / allTasks.length) * 100) : 0;
  const currentStageIndex = journeyStages.findIndex((s) => s.status === "current");
  const currentStage = currentStageIndex >= 0 ? journeyStages[currentStageIndex] : undefined;
  // The stage a hub shows: the current one, or the last once every task is done.
  const homeStage = currentStage ?? journeyStages[journeyStages.length - 1];
  // The client's next task is the first open one that is theirs to do. Tasks the
  // team does ("With us", awaitingTeam) never block it; with none left for the
  // client, it falls back to the first open task of any kind.
  const firstOpenMilestoneIndex = currentStage
    ? (() => {
        const mine = currentStage.milestones.findIndex((m) => m.status !== "done" && !m.awaitingTeam);
        return mine !== -1 ? mine : Math.max(0, currentStage.milestones.findIndex((m) => m.status !== "done"));
      })()
    : 0;
  const yourTurnId = currentStage?.milestones[firstOpenMilestoneIndex]?.id;
  const viewingStageIndex = journeyStages.findIndex((s) => s.id === viewingStageId);
  const viewingStage = viewingStageIndex >= 0 ? journeyStages[viewingStageIndex] : undefined;

  // ---- Journey-redesign derived values (Phase 3) ----
  function dayLabelOf(stage: { dayStart: number; dayEnd: number }) {
    return stage.dayStart === stage.dayEnd ? `Day ${stage.dayStart}` : `Days ${stage.dayStart}–${stage.dayEnd}`;
  }
  // Maps the 3-state milestone model onto the 4-status display vocabulary.
  // "With us" comes from the explicit awaitingTeam content flag.
  function taskDisplayStatus(m: JourneyMilestone): TaskDisplayStatus {
    if (m.status === "done") return "done";
    if (m.awaitingTeam) return "with-us";
    return m.id === yourTurnId ? "your-turn" : "up-next";
  }
  const stageDoneCount = currentStage ? currentStage.milestones.filter((m) => m.status === "done").length : 0;
  const stagePct =
    currentStage && currentStage.milestones.length
      ? Math.round((stageDoneCount / currentStage.milestones.length) * 100)
      : 0;
  const upNextCandidate = currentStage ? currentStage.milestones[firstOpenMilestoneIndex] : undefined;
  const upNext = upNextCandidate && taskDisplayStatus(upNextCandidate) === "your-turn" ? upNextCandidate : undefined;

  // Returns the stage id if approving `milestoneId` completes its whole stage.
  function stageCompletedBy(milestoneId: string): string | null {
    return stageCompletedByStep(journey.stages, completedIds, milestoneId);
  }

  function approveMilestone(milestoneId: string, note?: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(milestoneId);
      return next;
    });
    if (note !== undefined) {
      setNotes((prev) => ({ ...prev, [milestoneId]: note }));
    }
    if (portalToken) {
      fetch(`/api/portal/${portalToken}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId, note }),
      }).catch(() => {});
    }
  }

  // An upload task takes one or more CSVs (a lead list can come in parts).
  // Files upload one at a time; the client finishes the task when they've
  // added everything (Jesse, 2026-10-16).
  const MAX_UPLOAD_BYTES = 20_000_000;

  function readText(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("read"));
      reader.readAsText(file);
    });
  }

  async function uploadFiles(milestoneId: string, files: File[], options?: UploadOptions) {
    setUploadError(null);
    if (!options) {
      const bad = files.find((f) => !f.name.toLowerCase().endsWith(".csv"));
      if (bad) {
        setUploadError(`${bad.name} isn't a .csv file.`);
        return;
      }
    }
    const limit = options ? 25_000_000 : MAX_UPLOAD_BYTES;
    const big = files.find((f) => f.size > limit);
    if (big) {
      setUploadError(`${big.name} is too large. Please keep each file under ${Math.round(limit / 1_000_000)}MB.`);
      return;
    }

    setUploadingId(milestoneId);
    try {
      for (const file of files) {
        // The CSV upload reads the file as text; an "any files" step sends the file itself.
        let content = "";
        if (!options) {
          try {
            content = await readText(file);
          } catch {
            setUploadError(`Could not read ${file.name}.`);
            return;
          }
        }
        if (!portalToken) {
          setUploads((prev) => ({ ...prev, [milestoneId]: [...(prev[milestoneId] ?? []), { fileName: file.name, uploadedAt: new Date().toISOString() }] }));
          continue;
        }
        let payload: { ok: boolean; error?: string; file?: UploadMeta };
        try {
          const res = options
            ? await fetch(`/api/portal/${portalToken}/upload/${milestoneId}`, { method: "POST", body: (() => { const form = new FormData(); form.append("file", file); return form; })() })
            : await fetch(`/api/portal/${portalToken}/upload/${milestoneId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: file.name, content }),
              });
          payload = (await res.json()) as typeof payload;
        } catch {
          setUploadError("Could not reach the server.");
          return;
        }
        if (!payload.ok || !payload.file) {
          setUploadError(payload.error ?? `Could not upload ${file.name}.`);
          return;
        }
        const saved = payload.file;
        setUploads((prev) => ({ ...prev, [milestoneId]: [...(prev[milestoneId] ?? []), saved] }));
      }
    } finally {
      setUploadingId(null);
    }
  }

  function removeUpload(milestoneId: string, index: number) {
    const file = uploads[milestoneId]?.[index];
    if (!file) return;
    setUploadError(null);
    const drop = () => setUploads((prev) => ({ ...prev, [milestoneId]: (prev[milestoneId] ?? []).filter((_, i) => i !== index) }));
    if (!portalToken || file.id === undefined) {
      drop();
      return;
    }
    setUploadingId(milestoneId);
    fetch(`/api/portal/${portalToken}/upload/${milestoneId}?id=${file.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((payload: { ok: boolean; error?: string }) => {
        if (payload.ok) drop();
        else setUploadError(payload.error ?? "Could not remove that file.");
      })
      .catch(() => setUploadError("Could not reach the server."))
      .finally(() => setUploadingId(null));
  }

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  function openM(stageId: string, m: number) {
    setView("stage");
    setViewingStageId(stageId);
    setMilestone(m);
    window.scrollTo(0, 0);
  }

  function backToJourney() {
    setView("home");
    window.scrollTo(0, 0);
  }

  // Keep the address bar in step with what's on screen, so the browser's Back
  // and Forward buttons move between the journey page and a task without ever
  // leaving the client's own link: opening a task adds one history entry
  // (?task=<id>), moving between tasks replaces it, and going back to the
  // journey steps back over it.
  const openTaskId = view === "stage" ? viewingStage?.milestones[milestone - 1]?.id : undefined;
  useEffect(() => {
    if (view === "complete") return;
    const path = window.location.pathname;
    const shownTask = new URLSearchParams(window.location.search).get("task");
    if (openTaskId) {
      if (shownTask === openTaskId) return;
      const url = `${path}?task=${encodeURIComponent(openTaskId)}`;
      if (shownTask) window.history.replaceState(window.history.state, "", url);
      else window.history.pushState({ pjTask: true }, "", url);
    } else if (shownTask) {
      if ((window.history.state as { pjTask?: boolean } | null)?.pjTask) window.history.back();
      else window.history.replaceState(null, "", path);
    }
  }, [view, openTaskId]);
  useEffect(() => {
    const onPop = () => {
      const wanted = new URLSearchParams(window.location.search).get("task");
      if (!wanted) { setView("home"); return; }
      for (const stage of journeyStages) {
        const idx = stage.milestones.findIndex((m) => m.id === wanted);
        if (idx !== -1) { setViewingStageId(stage.id); setMilestone(idx + 1); setView("stage"); return; }
      }
      setView("home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [journeyStages]);

  // After a task auto-completes (upload / form submit), move the client onward:
  // fire the stage-completion payoff if it finished the stage, else advance to
  // the next task, else return to the journey.
  function advanceAfterComplete(milestoneId: string) {
    const completedStageId = stageCompletedBy(milestoneId);
    if (completedStageId) {
      setJustCompletedStageId(completedStageId);
      setView("complete");
      window.scrollTo(0, 0);
      return;
    }
    const stage = viewingStage;
    const idx = stage ? stage.milestones.findIndex((mm) => mm.id === milestoneId) : -1;
    const nextMine = stage ? stage.milestones.findIndex((mm, i) => i > idx && !mm.awaitingTeam) : -1;
    if (stage && idx >= 0 && nextMine !== -1) {
      setMilestone(nextMine + 1);
      window.scrollTo(0, 0);
    } else {
      backToJourney();
    }
  }

  function openVideo(title: string, src: string) {
    setVideoTitle(title);
    setVideoSrc(src);
    const t = setTimeout(() => {
      const v = modalVideoRef.current;
      if (v) {
        v.controls = true;
        v.muted = false;
        try {
          v.currentTime = 0;
        } catch {}
        v.play().catch(() => {});
      }
    }, 60);
    timers.current.push(t);
  }

  function closeVideo() {
    modalVideoRef.current?.pause();
    setVideoTitle(null);
  }

  return (
    <div
      // While the handoff skin is active, theme/accent attributes come off so
      // its token block applies cleanly (the accent selectors would otherwise
      // out-specificity it).
      data-pj-theme={designSkin !== "current" || theme === "warm" ? undefined : theme}
      data-pj-accent={designSkin !== "current" || theme !== "neutral" ? undefined : neutralAccent}
      data-pj-design={designSkin === "current" ? undefined : designSkin === "calm" ? "aurora" : designSkin === "groveaurora" ? "grove" : designSkin}
      data-pj-scheme={designSkin === "handoff" && handoffScheme === "dark" ? "dark" : designSkin === "calm" ? "calm" : designSkin === "groveaurora" ? "aurora" : undefined}
      style={{ background: "var(--pj-glow) no-repeat, var(--pj-bg)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", minHeight: "100vh" }}
    >
      {showWelcome &&
        (welcomeVersion === "funnel" && designSkin !== "groveaurora" ? (
          <WelcomeFunnel wordmark={journey.wordmark} brandName={brandName} color={designSkin === "grove" ? "#0f6b4b" : undefined} onStart={dismissWelcome} />
        ) : welcomeVersion === "aurora" || (welcomeVersion === "funnel" && designSkin === "groveaurora") ? (
          <WelcomeAurora
            wordmark={journey.wordmark}
            brandName={brandName}
            tagline={brandTagline}
            stages={journeyStages.map((s) => s.name)}
            onStartGesture={introVideo ? () => { introRef.current?.start(); setIntroPlaying(true); } : undefined}
            onStart={dismissWelcome}
          />
        ) : welcomeVersion === "marquee" ? (
          <WelcomeMarquee wordmark={journey.wordmark} brandName={brandName} onStart={dismissWelcome} />
        ) : (
          <WelcomeScreen name={name} wordmark={journey.wordmark} brandName={brandName} onStart={dismissWelcome} />
        ))}
      {/* Mounted while the welcome is up (hidden), so "Get started" can start it with sound. */}
      {introVideo && (showWelcome || introPlaying) ? (
        <IntroVideo
          ref={introRef}
          src={introVideo.src}
          poster={introVideo.poster}
          title={introVideo.title}
          visible={introPlaying}
          onDone={() => setIntroPlaying(false)}
        />
      ) : null}
      {!showWelcome && !introPlaying && showIncentive && !journey.hidesIncentive && <IncentiveModal onClose={dismissIncentive} />}
      {/* "Ask Jesse": only for products that switch it on (BSS custom first). */}
      {journey.assistant && portalToken && !showWelcome && !introPlaying && (
        <PortalAssistant portalToken={portalToken} firstName={name.trim().split(/\s+/)[0] ?? ""} />
      )}
      {/* Messages: step threads with the team, only for products that switch it on (AT Network first). */}
      {journey.comms && portalToken && !showWelcome && !introPlaying && (
        <PortalComms portalToken={portalToken} steps={journey.stages.flatMap((s) => s.milestones.map((m) => ({ id: m.id, title: m.title })))} />
      )}
      {/* Presentation switch: one small dot, bottom right, demo route only. */}
      {isDemo && (
        <button
          type="button"
          onClick={togglePills}
          aria-pressed={pillsOn}
          aria-label={pillsOn ? "Hide the review controls" : "Show the review controls"}
          title={pillsOn ? "Hide the review controls (presentation mode)" : "Show the review controls"}
          style={{ position: "fixed", bottom: 18, right: 18, zIndex: 71, width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(128,128,128,0.35)", background: pillsOn ? "rgba(20,20,20,0.82)" : "rgba(128,128,128,0.16)", color: pillsOn ? "#fff" : "rgba(128,128,128,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, opacity: pillsOn ? 1 : 0.55, transition: "opacity 300ms ease, background 300ms ease" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {pillsOn ? (
              <>
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </>
            ) : (
              <>
                <path d="M3 3l18 18M10.6 5.2A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1" />
              </>
            )}
          </svg>
        </button>
      )}

      {/* Review-only: welcome-generation toggle, floats OVER the welcome
          overlay (demo route only). */}
      {showWelcome && showPills && (
        <div style={{ position: "fixed", top: 18, right: 18, zIndex: 70, display: "flex", gap: 4, background: "#fff", border: "1px solid #e0dcd2", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(0,0,0,.5)" }}>
          {(
            [
              ["funnel", "Funnel"],
              ["aurora", "Aurora"],
              ["marquee", "Marquee"],
              ["mosaic", "Mosaic"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setWelcomeVersion(v)}
              style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: welcomeVersion === v ? "#17130e" : "transparent", color: welcomeVersion === v ? "#f7f5f0" : "#6f6a60", whiteSpace: "nowrap" }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes portalPulse { 0% { transform: scale(1); opacity: 0.65; } 70% { transform: scale(2.2); opacity: 0; } 100% { opacity: 0; } }
        @keyframes viewIn { from { transform: translateY(18px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        @keyframes soundPulse { 0%, 100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.06); } }
      `}</style>

      {/* TOP BAR (the handoff design's home brings its own header) */}
      {!(designSkin !== "current" && view === "home") && (
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--pj-bg)",
          borderBottom: "1px solid var(--pj-line)",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "15px 24px",
          }}
        >
          {/* The name, top left, is the way home: back to the journey page. */}
          <button type="button" className="pj-home-link" onClick={backToJourney} title="Home" style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--pj-ink)" }}>{headerName(journey, designSkin)}</button>
          <span style={{ width: 1, height: 18, background: "var(--pj-line)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--pj-muted)", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Client Portal{name ? ` · ${name}` : ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              Day {currentDay} / {journey.totalDays} · <b style={{ color: "var(--pj-done)", fontWeight: 650 }}>on track</b>
            </span>
            {/* Voice-guide toggle: lives with the theme dots so all "portal
                preferences" share one home. */}
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={voiceOn ? "Turn voice guide off" : "Turn voice guide on"}
              aria-pressed={voiceOn}
              title={voiceOn ? "Voice guide on" : "Voice guide off"}
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: voiceOn ? "var(--pj-act)" : "var(--pj-faint)", display: "flex", alignItems: "center" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                {voiceOn ? (
                  <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
                ) : (
                  <path d="m16 9 6 6M22 9l-6 6" />
                )}
              </svg>
            </button>
            {/* Look switcher: swatch dots (warm terracotta / cool steel /
                neutral white). Swatches are hardcoded — they must show their
                own colour regardless of which theme is active; the ring
                colour differs for neutral so a near-white dot stays visible.
                Hidden under the handoff design, which brings its own
                Light|Dark schemes instead. */}
            {designSkin === "current" && (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {(
                [
                  ["warm", "#c67139", "#c67139", "Warm look"],
                  ["cool", "#38708c", "#38708c", "Cool look"],
                  ["neutral", "#e6e6e2", "#9a9b95", "Neutral look"],
                ] as const
              ).map(([value, swatch, ring, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchTheme(value)}
                  aria-label={label}
                  aria-pressed={theme === value}
                  title={label}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: swatch,
                    border: "1px solid rgba(0, 0, 0, 0.14)",
                    padding: 0,
                    cursor: "pointer",
                    opacity: theme === value ? 1 : 0.45,
                    boxShadow: theme === value ? "0 0 0 2px var(--pj-bg), 0 0 0 3.5px " + ring : "none",
                    transition: "opacity 160ms ease, box-shadow 160ms ease",
                  }}
                />
              ))}
            </span>
            )}
            <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--pj-act)", color: "var(--pj-act-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {name.charAt(0)}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* JOURNEY — home view */}
      {view === "home" && designSkin === "current" && (
        <div
          className={railLayout === "focus" ? "pj-home pj-home--focus" : "pj-home"}
          // The deep-frame tint exists to make the journey card pop, so it
          // only applies in the rail layout. Focus keeps the light frame —
          // lighter than the page ground, so the panel reads as a distinct
          // floating surface instead of melting into the glow.
          style={railLayout === "rail" && (theme !== "warm" || railVariant === "deepframe") ? { background: "var(--pj-frame-deep)", borderColor: "var(--pj-frame-deep-line)" } : undefined}
        >
          <div className="pj-rail-desktop">
            <StageRail stages={journeyStages} overallPercent={progress} onSelectStage={(stageId) => openM(stageId, 1)} variant={railVariant} cool={theme !== "warm"} />
          </div>
          {currentStage && (
            <div className="pj-segbar" style={{ padding: "14px 18px", borderBottom: "1px solid var(--pj-line)", background: "var(--pj-rail)" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {journeyStages.map((s) => (
                  <span
                    key={s.id}
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 5,
                      background: s.status === "done" ? "var(--pj-done)" : s.status === "current" ? "var(--pj-act)" : "var(--pj-track)",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", marginTop: 10 }}>
                <b style={{ fontSize: 13.5, fontWeight: 650 }}>
                  Stage {currentStageIndex + 1} · {currentStage.name}
                </b>
                <span style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {stageDoneCount} / {currentStage.milestones.length} done
                </span>
              </div>
            </div>
          )}
          <section className="pj-pane">
            <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-act)", marginBottom: 10 }}>
              Stage {currentStageIndex + 1} of {journeyStages.length}{currentStage ? ` · ${dayLabelOf(currentStage)}` : ""}
            </div>
            <h2 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
              {currentStage ? currentStage.name : "You’re all caught up"}
            </h2>
            {/* A stage with no blurb gets no paragraph (Onboarding: heading
                straight into the action). The fallback line belongs only to
                the journey-complete state, where there is no current stage. */}
            {(currentStage ? currentStage.blurb : "Everything we need from you is done — sit tight while we build.") ? (
              <p style={{ color: "var(--pj-muted)", fontSize: 14.5, maxWidth: "56ch", margin: 0 }}>
                {currentStage ? currentStage.blurb : "Everything we need from you is done — sit tight while we build."}
              </p>
            ) : null}

            {currentStage && voiceOn && (() => {
              const guide = stageGuideOf(journey, currentStage.id);
              return guide ? (
                <div style={{ position: "absolute", top: "clamp(24px, 4vh, 44px)", right: "clamp(20px, 4vw, 64px)" }}>
                  <StageGuide key={currentStage.id} guide={guide} />
                </div>
              ) : null;
            })()}

            {currentStage && (
              <>
                <div className="pj-stage-progress" style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 26px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px", maxWidth: 220, height: 6, borderRadius: 6, background: "var(--pj-track)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${stagePct}%`, background: "var(--pj-done)", borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {stageDoneCount} / {currentStage.milestones.length} done
                  </span>
                </div>

                <UpNextCard
                  title={upNext ? upNext.title : "We’re preparing your next step"}
                  desc={
                    upNext
                      ? `${upNext.detail}${upNext.formId && formSizeLabel(upNext.formId) ? ` (${formSizeLabel(upNext.formId)}.)` : ""}`
                      : "Nothing needed from you right now — we’ll flag you the moment there’s something to review."
                  }
                  actionable={!!upNext}
                  onStart={upNext ? () => openM(currentStage.id, firstOpenMilestoneIndex + 1) : undefined}
                />

                <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-card)", overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setTasksOpen(!tasksOpen)}
                    aria-expanded={tasksOpen}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "15px 20px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body), sans-serif", textAlign: "left" }}
                  >
                    <span style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", whiteSpace: "nowrap" }}>
                      All tasks<span className="pj-bar-ext"> in this stage</span>
                    </span>
                    {/* One dot per task — the whole stage scannable at a glance. */}
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {currentStage.milestones.map((m) => {
                        const ds = taskDisplayStatus(m);
                        const solid = ds === "done" ? "var(--pj-done)" : ds === "your-turn" ? "var(--pj-act)" : ds === "with-us" ? "var(--pj-withus)" : null;
                        return (
                          <span
                            key={m.id}
                            style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: solid ?? "transparent", border: solid ? "none" : "1.5px solid var(--pj-ring)" }}
                          />
                        );
                      })}
                    </span>
                    <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {stageDoneCount} / {currentStage.milestones.length} done
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: tasksOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>
                  {tasksOpen &&
                    currentStage.milestones.map((m, mi) => {
                      const ds = taskDisplayStatus(m);
                      return (
                        <div key={m.id} style={{ borderTop: "1px solid var(--pj-line-soft)" }}>
                          <TaskRow
                            title={m.title}
                            subtitle={ds === "your-turn" ? "Approve, or request changes" : undefined}
                            status={ds}
                            onStart={() => openM(currentStage.id, mi + 1)}
                            onView={() => openM(currentStage.id, mi + 1)}
                          />
                        </div>
                      );
                    })}
                </div>

                {currentStage.statusNotes.length > 0 && (
                  <div style={{ marginTop: 22 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", margin: "0 0 10px" }}>
                      Happening with us
                    </div>
                    <div style={{ background: "var(--pj-withus-fill)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-sm)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {currentStage.statusNotes.map((note) => (
                        <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "var(--pj-ink)" }}>
                          <span style={{ color: "var(--pj-withus)", marginTop: 1 }}>●</span>
                          <span><LinkifiedLine line={note} /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <AskChips items={askItemsOf(journey, currentStage.id)} stageKey={currentStage.id} />
              </>
            )}
          </section>
        </div>
      )}

      {/* NEW DESIGN (handoff package) — full structural hub, home view */}
      {view === "home" && designSkin === "handoff" && (
        <HandoffHub
          brand={hubBrand(journey, "handoff")}
          clientLabel={`Client Portal${name ? ` \u00b7 ${name}` : ""}`}
          name={name}
          currentDay={currentDay}
          totalDays={journey.totalDays}
          stages={journeyStages}
          currentStageIndex={currentStageIndex}
          stageDoneCount={stageDoneCount}
          stagePct={stagePct}
          overallPercent={progress}
          upNext={upNext}
          onStartUpNext={currentStage && upNext ? () => openM(currentStage.id, firstOpenMilestoneIndex + 1) : undefined}
          onStartTask={(mi) => homeStage && openM(homeStage.id, mi + 1)}
          onViewTask={(mi) => homeStage && openM(homeStage.id, mi + 1)}
          taskStatus={taskDisplayStatus}
          tasksOpen={tasksOpen}
          onToggleTasks={() => setTasksOpen(!tasksOpen)}
          showRail={railLayout === "rail"}
          orbSlot={
            voiceOn && currentStage
              ? (() => {
                  const g = stageGuideOf(journey, currentStage.id);
                  return g ? <StageGuide key={currentStage.id} guide={g} /> : null;
                })()
              : null
          }
        />
      )}

      {/* COBALT DESIGN (motion redesign) — white gallery hub, home view */}
      {view === "home" && designSkin === "cobalt" && (
        <CobaltHub
          brand={hubBrand(journey, "cobalt")}
          clientLabel={`Client Portal${name ? ` \u00b7 ${name}` : ""}`}
          name={name}
          currentDay={currentDay}
          totalDays={journey.totalDays}
          stages={journeyStages}
          currentStageIndex={currentStageIndex}
          stageDoneCount={stageDoneCount}
          overallPercent={progress}
          showRail={railLayout === "rail"}
          onSelectStage={(stageId) => openM(stageId, 1)}
          upNext={upNext}
          upNextDetail={upNext ? `${upNext.detail}${upNext.formId && formSizeLabel(upNext.formId) ? ` (${formSizeLabel(upNext.formId)}.)` : ""}` : undefined}
          onStartUpNext={currentStage && upNext ? () => openM(currentStage.id, firstOpenMilestoneIndex + 1) : undefined}
          onOpenTask={(mi) => homeStage && openM(homeStage.id, mi + 1)}
          taskStatus={taskDisplayStatus}
          tasksOpen={tasksOpen}
          onToggleTasks={() => setTasksOpen(!tasksOpen)}
          orbSlot={
            voiceOn && currentStage
              ? (() => {
                  const g = stageGuideOf(journey, currentStage.id);
                  return g ? <StageGuide key={currentStage.id} guide={g} /> : null;
                })()
              : null
          }
        >
          {currentStage ? <AskChips items={askItemsOf(journey, currentStage.id)} stageKey={currentStage.id} /> : null}
        </CobaltHub>
      )}

      {/* AURORA DESIGN (motion redesign, second direction) — night hub with stage art, home view */}
      {view === "home" && (designSkin === "aurora" || designSkin === "calm") && (
        <AuroraHub
          calm={designSkin === "calm"}
          brand={hubBrand(journey, "aurora")}
          clientLabel={`Client Portal${name ? ` \u00b7 ${name}` : ""}`}
          name={name}
          currentDay={currentDay}
          totalDays={journey.totalDays}
          stages={journeyStages}
          currentStageIndex={currentStageIndex}
          stageDoneCount={stageDoneCount}
          stagePct={stagePct}
          overallPercent={progress}
          showRail={railLayout === "rail"}
          onSelectStage={(stageId) => openM(stageId, 1)}
          upNext={upNext}
          upNextDetail={upNext ? `${upNext.detail}${upNext.formId && formSizeLabel(upNext.formId) ? ` (${formSizeLabel(upNext.formId)}.)` : ""}` : undefined}
          onStartUpNext={currentStage && upNext ? () => openM(currentStage.id, firstOpenMilestoneIndex + 1) : undefined}
          onOpenTask={(mi) => homeStage && openM(homeStage.id, mi + 1)}
          taskStatus={taskDisplayStatus}
          tasksOpen={tasksOpen}
          onToggleTasks={() => setTasksOpen(!tasksOpen)}
          orbSlot={
            voiceOn && currentStage
              ? (() => {
                  const g = stageGuideOf(journey, currentStage.id);
                  return g ? <StageGuide key={currentStage.id} guide={g} /> : null;
                })()
              : null
          }
        >
          {currentStage ? <AskChips items={askItemsOf(journey, currentStage.id)} stageKey={currentStage.id} /> : null}
        </AuroraHub>
      )}

      {/* GROVE DESIGN (motion redesign, third direction) — clean hub with one green band, home view */}
      {view === "home" && (designSkin === "grove" || designSkin === "groveaurora") && (
        <GroveHub
          aurora={designSkin === "groveaurora"}
          brand={hubBrand(journey, "grove")}
          clientLabel={`Client Portal${name ? ` \u00b7 ${name}` : ""}`}
          name={name}
          currentDay={currentDay}
          totalDays={journey.totalDays}
          stages={journeyStages}
          currentStageIndex={currentStageIndex}
          stageDoneCount={stageDoneCount}
          stagePct={stagePct}
          overallPercent={progress}
          showRail={railLayout === "rail"}
          onSelectStage={(stageId) => openM(stageId, 1)}
          onOpenStageTask={(stageId, n) => openM(stageId, n)}
          calendarDay={calendarDay}
          stringPlan={journey.stringPlan ?? undefined}
          upNext={upNext}
          upNextDetail={upNext ? `${upNext.detail}${upNext.formId && formSizeLabel(upNext.formId) ? ` (${formSizeLabel(upNext.formId)}.)` : ""}` : undefined}
          onStartUpNext={currentStage && upNext ? () => openM(currentStage.id, firstOpenMilestoneIndex + 1) : undefined}
          onOpenTask={(mi) => homeStage && openM(homeStage.id, mi + 1)}
          taskStatus={taskDisplayStatus}
          tasksOpen={tasksOpen}
          onToggleTasks={() => setTasksOpen(!tasksOpen)}
          orbSlot={
            voiceOn && currentStage
              ? (() => {
                  const g = stageGuideOf(journey, currentStage.id);
                  return g ? <StageGuide key={currentStage.id} guide={g} /> : null;
                })()
              : null
          }
        >
          {currentStage ? <AskChips items={askItemsOf(journey, currentStage.id)} stageKey={currentStage.id} /> : null}
        </GroveHub>
      )}

      {/* Review pills — rendered outside both layout trees so every option
          survives the design swap (demo route only). */}
      {view === "home" && (
        <>
          {/* Review-only: design-skin toggle (current system vs the client
              portal handoff package). Demo route only. */}
          {showPills && (
            <div style={{ position: "fixed", bottom: 156, right: 18, zIndex: 50, maxWidth: "calc(100vw - 36px)", overflowX: "auto", display: "flex", gap: 4, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(60,46,32,.45)" }}>
              {(
                [
                  ["current", "Current design"],
                  ["handoff", "Handoff design"],
                  ["cobalt", "Cobalt design"],
                  ["aurora", "Aurora design"],
                  ["calm", "Aurora calm"],
                  ["grove", "Grove design"],
                  ["groveaurora", "Grove Aurora"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => { setDesignSkin(v); if (v === "handoff") setRailLayout("rail"); }}
                  style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: designSkin === v ? "var(--pj-act)" : "transparent", color: designSkin === v ? "var(--pj-act-ink)" : "var(--pj-muted)", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Review-only: Neutral accent audition. Demo route only, shows
              while the neutral theme is active. Delete once a winner is
              picked. */}
          {showPills && theme === "neutral" && designSkin === "current" && (
            <div style={{ position: "fixed", bottom: 110, right: 18, zIndex: 50, display: "flex", gap: 4, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(60,46,32,.45)" }}>
              {(
                [
                  ["terracotta", "Terracotta"],
                  ["brass", "Brass"],
                  ["indigo", "Indigo"],
                  ["graphite", "Graphite"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setNeutralAccent(v)}
                  style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: neutralAccent === v ? "var(--pj-act)" : "transparent", color: neutralAccent === v ? "var(--pj-act-ink)" : "var(--pj-muted)", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Review-only: layout toggle (journey rail vs full-width focus).
              Demo route only; works in both themes. Delete once a winner is
              picked. */}
          {showPills && (
            <div style={{ position: "fixed", bottom: 64, right: 18, zIndex: 50, display: "flex", gap: 4, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(60,46,32,.45)" }}>
              {(
                [
                  ["rail", "Journey rail"],
                  ["focus", "Focus"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setRailLayout(v)}
                  style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: railLayout === v ? "var(--pj-act)" : "transparent", color: railLayout === v ? "var(--pj-act-ink)" : "var(--pj-muted)", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              ))}
              <span style={{ width: 1, alignSelf: "stretch", background: "var(--pj-line)", margin: "2px 2px" }} />
              <button
                onClick={() => setShowWelcome(true)}
                title="Replay the welcome landing (clients see it on their first visit; ?welcome=1 works on any portal link)"
                style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: "transparent", color: "var(--pj-muted)", whiteSpace: "nowrap" }}
              >
                Welcome
              </button>
              <button
                onClick={() => setShowIncentive(true)}
                title="Replay the $200 incentive popup (clients see it once, right after welcome; ?incentive=1 works on any portal link)"
                style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: "transparent", color: "var(--pj-muted)", whiteSpace: "nowrap" }}
              >
                Incentive
              </button>
            </div>
          )}

          {/* Review-only: journey-card treatment toggle. Demo route only —
              real client portals never render this. Warm-look tool, so it
              hides while the cool theme is active. Delete once a winner is
              picked. */}
          {showPills && theme === "warm" && designSkin === "current" && (
            <div style={{ position: "fixed", bottom: 18, right: 58, zIndex: 50, display: "flex", gap: 4, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(60,46,32,.45)" }}>
              {(
                [
                  ["deepframe", "Deep frame"],
                  ["card3d", "3D card"],
                  ["flat", "Flat panel"],
                  ["baseline", "Baseline"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setRailVariant(v)}
                  style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: railVariant === v ? "var(--pj-act)" : "transparent", color: railVariant === v ? "var(--pj-act-ink)" : "var(--pj-muted)", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* Handoff design brings its own Light|Dark schemes (per the
              handoff README) in place of the theme dots. */}
          {showPills && designSkin === "handoff" && (
            <div style={{ position: "fixed", bottom: 110, right: 18, zIndex: 50, display: "flex", gap: 4, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(60,46,32,.45)" }}>
              {(
                [
                  ["light", "Light"],
                  ["dark", "Dark"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setHandoffScheme(v)}
                  style={{ border: "none", cursor: "pointer", borderRadius: 999, padding: "7px 13px", fontSize: 11, fontWeight: 650, fontFamily: "var(--font-body), sans-serif", background: handoffScheme === v ? "#17130e" : "transparent", color: handoffScheme === v ? "#f7f5f0" : "var(--pj-muted)", whiteSpace: "nowrap" }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* STAGE DETAIL */}
      {view === "stage" && viewingStage && (
        <section style={{ width: "min(760px, calc(100% - 48px))", margin: "28px auto 56px", padding: "40px clamp(28px, 5vw, 56px) 72px", background: "var(--pj-frame)", border: "1px solid var(--pj-frame-line)", borderRadius: 28, boxShadow: "var(--pj-shadow-frame)", animation: "viewIn 0.4s cubic-bezier(0.2,0.7,0.2,1)" }}>
          <button
            onClick={backToJourney}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "var(--pj-muted)", fontFamily: "var(--font-body), sans-serif", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 26 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to {viewingStage.name}
          </button>

          {(() => {
            const m: JourneyMilestone | undefined = viewingStage.milestones[milestone - 1];
            if (!m) return null;
            // The client steps through their own tasks only; the team's tasks
            // ("With us") are skipped. Products without team tasks are unchanged.
            const mine = viewingStage.milestones.map((mm, i) => ({ mm, n: i + 1 })).filter((x) => !x.mm.awaitingTeam).map((x) => x.n);
            const isTeamTask = Boolean(m.awaitingTeam);
            const pos = mine.indexOf(milestone);
            const isLast = isTeamTask || pos === mine.length - 1;
            const isFirst = isTeamTask || pos <= 0;
            const nextN = pos >= 0 && pos < mine.length - 1 ? mine[pos + 1] : undefined;
            const prevN = pos > 0 ? mine[pos - 1] : undefined;
            const stepForm = m.status !== "done" && m.formId ? onboardingFormById(m.formId) : undefined;
            const twoWays = Boolean(stepForm && m.interview);
            const answerMode = twoWays ? answerModes[m.id] : undefined;
            const choosingMode = twoWays && !answerMode;
            const inlineForm = twoWays && answerMode !== "type" ? undefined : stepForm;
            const switchMode = (mode: "type" | "talk") => { setAnswerModes((prev) => ({ ...prev, [m.id]: mode })); window.scrollTo(0, 0); };
            const savedContent = liveContent[m.id];
            const noteValue = noteDrafts[m.id] ?? notes[m.id] ?? "";
            const uploadedFiles = uploads[m.id] ?? [];
            const showUploadWidget = m.status !== "done" && m.hasUpload;
            // The agreement (AT Network first): its own accept-and-sign form replaces the step's buttons.
            const agreementHere = journey.agreement && journey.agreement.step === m.id ? journey.agreement : null;
            const hasCustomFlow = Boolean(inlineForm) || showUploadWidget || choosingMode || Boolean(agreementHere);
            const uploadOpts = m.uploadOptions;
            // The upload box: Scale's CSV lead list, or (with uploadOptions) any files, an optional text box and an
            // always-available Next. With stayOpen it also shows after the step is ticked, without the Next button.
            const uploadBox = (showNext: boolean) => (
                  <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 22 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 8 }}>
                      {uploadOpts?.title ?? "Upload your files"}
                    </div>
                    <p style={{ fontSize: 13.5, color: "var(--pj-muted)", lineHeight: 1.5, margin: "0 0 14px" }}>
                      {uploadOpts?.hint ?? "One file with your full list is best. If it's split across several files, add them all."}
                    </p>
                    {uploadedFiles.length > 0 && (
                      <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                        {uploadedFiles.map((f, i) => (
                          <li key={f.id ?? `${f.fileName}-${i}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: "var(--pj-radius-sm)", background: "var(--pj-well)", fontSize: 14 }}>
                            <span aria-hidden style={{ color: "var(--pj-act)", fontWeight: 700 }}>✓</span>
                            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--pj-ink)" }}>{f.fileName}</span>
                            <button
                              type="button"
                              onClick={() => removeUpload(m.id, i)}
                              disabled={uploadingId === m.id}
                              aria-label={`Remove ${f.fileName}`}
                              style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, color: "var(--pj-muted)", fontSize: 12.5, textDecoration: "underline", cursor: uploadingId === m.id ? "default" : "pointer", fontFamily: "inherit" }}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        border: "1.5px dashed var(--pj-line)", borderRadius: "var(--pj-radius-sm)", padding: uploadedFiles.length ? "16px 20px" : "28px 20px",
                        cursor: uploadingId === m.id ? "default" : "pointer", color: "var(--pj-muted)",
                        fontFamily: "var(--font-body), sans-serif", fontSize: 14,
                      }}
                    >
                      <input
                        type="file"
                        accept={uploadOpts?.accept ?? ".csv"}
                        multiple
                        disabled={uploadingId === m.id}
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          if (files.length) void uploadFiles(m.id, files, uploadOpts);
                          e.target.value = "";
                        }}
                        style={{ display: "none" }}
                      />
                      {uploadingId === m.id ? "Working…" : uploadOpts ? (uploadedFiles.length ? uploadOpts.chooseMore : uploadOpts.choose) : uploadedFiles.length ? "+ Add another .csv file" : "Click to choose your .csv file(s)"}
                    </label>
                    {uploadError && <div style={{ marginTop: 12, fontSize: 13, color: "var(--pj-act)" }}>{uploadError}</div>}
                    {uploadOpts && m.notePrompt && showNext && (
                      <div style={{ marginTop: 18 }}>
                        <label style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                          {m.notePrompt}
                        </label>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder={m.notePlaceholder ?? "Optional"}
                          rows={5}
                          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", fontSize: 14, resize: "vertical", outline: "none" }}
                        />
                        <MicButton onText={(chunk) => setNoteDrafts((prev) => ({ ...prev, [m.id]: `${prev[m.id] ?? noteValue} ${chunk}`.trim() }))} />
                      </div>
                    )}
                    {showNext && (uploadOpts || uploadedFiles.length > 0) && (
                      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontSize: 12.5, color: "var(--pj-faint)" }}>
                          {uploadedFiles.length === 0 ? "Nothing added yet. That's fine, you can add files any time." : uploadedFiles.length === 1 ? "1 file added" : `${uploadedFiles.length} files added`}
                        </span>
                        <button
                          type="button"
                          disabled={uploadingId === m.id}
                          onClick={() => {
                            approveMilestone(m.id, uploadOpts && m.notePrompt ? noteValue : undefined);
                            advanceAfterComplete(m.id);
                          }}
                          style={{ marginLeft: "auto", background: "var(--pj-btn-grad)", color: "var(--pj-act-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 650, fontSize: 15, border: "none", borderRadius: "var(--pj-radius-pill)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 9, boxShadow: "var(--pj-shadow-btn)", cursor: uploadingId === m.id ? "default" : "pointer", opacity: uploadingId === m.id ? 0.6 : 1 }}
                        >
                          {uploadOpts ? (m.doneLabel ?? "Next") : <>I&apos;ve added everything</>} <span style={{ fontSize: 17 }}>→</span>
                        </button>
                      </div>
                    )}
                  </div>
            );
            // The customer journey map, on the one step the product puts it on.
            const mapHere = journey.journeyMap && journey.journeyMap.step === m.id ? journey.journeyMap.content : null;

            return (
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-act)", marginBottom: 12 }}>
                  {isTeamTask ? `${viewingStage.name} · Our team’s task` : `${viewingStage.name} · Task ${pos + 1} of ${mine.length}`}
                </div>
                <h3 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 10px" }}>{m.title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--pj-muted)", margin: 0, maxWidth: "54ch", lineHeight: 1.55 }}>{m.detail}</p>
                {/* Messages on this step (products with comms only): opens the panel on this step's thread. */}
                {journey.comms && (
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("pjc:open", { detail: m.id }))}
                    style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-ink)", font: "600 13px var(--font-body), sans-serif", cursor: "pointer" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Messages on this step
                  </button>
                )}
                {taskNote(journey, m.id) ? (
                  <div className="pj-task-note">
                    <span className="pj-task-note-dot" aria-hidden />
                    {taskNote(journey, m.id)}
                  </div>
                ) : null}

                {showsTaskVideo(journey, m) && (
                  <button
                    onClick={() => m.videoUrl && openVideo(m.title, m.videoUrl)}
                    style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-pill)", padding: "7px 16px 7px 7px", color: "var(--pj-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 550, fontSize: 13, cursor: "pointer" }}
                  >
                    <PlayIcon color="var(--pj-act)" />
                    Watch how it works
                  </button>
                )}

                {m.guideUrl && (
                  <a
                    href={m.guideUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: 16, marginLeft: m.videoUrl ? 10 : 0, display: "inline-flex", alignItems: "center", gap: 9, background: "var(--pj-card)", border: "1px solid var(--pj-ink)", borderRadius: "var(--pj-radius-pill)", padding: "9px 18px", color: "var(--pj-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {m.guideLabel ?? "Step-by-step guide"}
                  </a>
                )}

                {m.inviteEmail && (
                  <div className="pj-invite">
                    <div>
                      <div className="pj-invite-label">Invite this email</div>
                      <div className="pj-invite-email">{m.inviteEmail}</div>
                    </div>
                    <button
                      type="button"
                      className="pj-invite-copy"
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        void navigator.clipboard?.writeText(m.inviteEmail ?? "").then(() => {
                          btn.textContent = "Copied";
                          window.setTimeout(() => { btn.textContent = "Copy"; }, 1600);
                        });
                      }}
                    >
                      Copy
                    </button>
                  </div>
                )}

                {m.steps && m.steps.length > 0 && (
                  <div style={{ marginTop: 20, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 22 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 14 }}>
                      How to do it
                    </div>
                    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
                      {m.steps.map((s, i) => (
                        <li key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                          <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 99, background: "var(--pj-act-fill)", color: "var(--pj-act)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 14, color: "var(--pj-ink)", lineHeight: 1.55 }}><LinkifiedLine line={s} /></span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt={m.imageAlt ?? ""} className="pj-step-image" loading="lazy" />
                )}

                {showsTaskImportant(journey, m) && (
                  <div style={{ marginTop: 18, display: "flex", gap: 11, borderRadius: "var(--pj-radius-sm)", border: "1px solid color-mix(in srgb, var(--pj-act) 40%, transparent)", background: "var(--pj-act-fill)", padding: "13px 16px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pj-act)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                    <div style={{ fontSize: 13.5, color: "var(--pj-ink)", lineHeight: 1.5 }}>
                      <b>Important — </b>{m.important}
                    </div>
                  </div>
                )}

                {m.status === "done" ? (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-done)", background: "var(--pj-done-fill)", padding: "16px 18px" }}>
                      <div style={{ width: 24, height: 24, borderRadius: 99, background: "var(--pj-done)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckIcon size={12} color="#fff" />
                      </div>
                      <div style={{ flex: 1, fontSize: 14, color: "var(--pj-ink)" }}>You&apos;ve completed this task.</div>
                    </div>
                    {mapHere && <JourneyMap content={mapHere} portalToken={portalToken} readOnly />}
                    {agreementHere && portalToken && <AgreementAccept portalToken={portalToken} agreement={agreementHere} />}
                    {m.hasUpload && uploadOpts?.stayOpen && uploadBox(false)}
                    {savedContent && (
                      <div style={{ marginTop: 14, borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: "16px 18px" }}>
                        {savedContent.split("\n").filter(Boolean).map((line, i) => (
                          <p key={i} style={{ fontSize: 14, color: "var(--pj-ink)", margin: i === 0 ? 0 : "8px 0 0", lineHeight: 1.6 }}><LinkifiedLine line={line} /></p>
                        ))}
                      </div>
                    )}
                    {notes[m.id] && !mapHere && (
                      <div style={{ marginTop: 14, fontSize: 13, color: "var(--pj-muted)" }}>
                        <span style={{ color: "var(--pj-act)", fontWeight: 600 }}>Your note:</span> {notes[m.id]}
                      </div>
                    )}
                    {uploadedFiles.length > 0 && !uploadOpts?.stayOpen && (
                      <div style={{ marginTop: 14, fontSize: 13, color: "var(--pj-muted)" }}>
                        <span style={{ color: "var(--pj-act)", fontWeight: 600 }}>Uploaded:</span> {uploadedFiles.map((f) => f.fileName).join(", ")}
                      </div>
                    )}
                  </div>
                ) : choosingMode ? (
                  <div className="pj-answer-modes">
                    <button type="button" className="pj-answer-mode" onClick={() => switchMode("type")}>
                      <span className="pj-answer-mode-title">Type my answers</span>
                      <span className="pj-answer-mode-sub">One quick question at a time. Saves as you go.</span>
                    </button>
                    <button type="button" className="pj-answer-mode" onClick={() => switchMode("talk")}>
                      <span className="pj-answer-mode-title">Talk it through</span>
                      <span className="pj-answer-mode-sub">We ask out loud, you answer out loud. Fix anything before you send it.</span>
                    </button>
                  </div>
                ) : inlineForm ? (
                  <>
                    {twoWays && (
                      <button type="button" className="pj-answer-switch" onClick={() => switchMode("talk")}>Rather talk it through?</button>
                    )}
                    <OnboardingFormStepper
                      form={inlineForm}
                      portalToken={portalToken}
                      onComplete={() => {
                        approveMilestone(m.id);
                        advanceAfterComplete(m.id);
                      }}
                    />
                  </>
                ) : showUploadWidget ? (
                  uploadBox(true)
                ) : m.showPortalLink ? (
                  <PortalLinkCard portalToken={portalToken} />
                ) : m.embedUrl ? (
                  <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                        {m.embedTitle ?? m.title}
                      </div>
                      <a href={m.embedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-act)", textDecoration: "none", whiteSpace: "nowrap" }}>
                        Open in a new tab ↗
                      </a>
                    </div>
                    <div style={{ borderRadius: "var(--pj-radius-sm)", overflow: "hidden", border: "1px solid var(--pj-line)", background: "var(--pj-well)" }}>
                      <iframe src={m.embedUrl} title={m.embedTitle ?? m.title} style={{ display: "block", width: "100%", height: 640, border: 0 }} loading="lazy" allow="camera; microphone" />
                    </div>
                    {m.embedNote && (
                      <p style={{ fontSize: 12.5, color: "var(--pj-faint)", margin: "14px 0 0" }}>{m.embedNote}</p>
                    )}
                  </div>
                ) : showsTaskBooking(journey, m) ? (
                  <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                        Book your call
                      </div>
                      <a href={m.bookingUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-act)", textDecoration: "none", whiteSpace: "nowrap" }}>
                        Open in a new tab ↗
                      </a>
                    </div>
                    <div style={{ borderRadius: "var(--pj-radius-sm)", overflow: "hidden", border: "1px solid var(--pj-line)", background: "var(--pj-well)" }}>
                      <iframe
                        src={m.bookingUrl}
                        title="Book your welcome call"
                        style={{ display: "block", width: "100%", height: 680, border: 0 }}
                        loading="lazy"
                      />
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--pj-faint)", margin: "14px 0 0" }}>
                      Pick a time above — we&apos;ll send the calendar invite. Once it&apos;s booked, mark this task complete below.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Only show a content card when it adds something beyond the
                        description above — i.e. team-pasted review content. For a
                        plain task the detail at the top already says it all. */}
                    {agreementHere && portalToken && (
                      <AgreementAccept
                        portalToken={portalToken}
                        agreement={agreementHere}
                        onAccepted={(note) => {
                          // The server has recorded it and ticked the step; mirror that here and move on.
                          const completedStageId = stageCompletedBy(m.id);
                          approveMilestone(m.id, note);
                          if (completedStageId) {
                            setJustCompletedStageId(completedStageId);
                            setView("complete");
                            window.scrollTo(0, 0);
                          } else if (nextN) {
                            setMilestone(nextN);
                          } else {
                            backToJourney();
                          }
                        }}
                      />
                    )}
                    {mapHere && (
                      <JourneyMap
                        content={mapHere}
                        portalToken={portalToken}
                        onNotesChange={(compiled) => setNoteDrafts((prev) => (prev[m.id] === compiled ? prev : { ...prev, [m.id]: compiled }))}
                      />
                    )}

                    {m.hasEditableContent && (
                      <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 22 }}>
                        <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 12 }}>
                          For your review
                        </div>
                        {savedContent ? (
                          savedContent.split("\n").filter(Boolean).map((line, i) => (
                            <p key={i} style={{ fontSize: 15, color: "var(--pj-ink)", lineHeight: 1.6, margin: i === 0 ? 0 : "10px 0 0" }}><LinkifiedLine line={line} /></p>
                          ))
                        ) : (
                          <p style={{ fontSize: 15, color: "var(--pj-muted)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                            Your account team is finalizing these — check back soon.
                          </p>
                        )}
                      </div>
                    )}

                    {showsPlayground(journey, m.id) && portalToken && (
                      <ReceptionistPlayground portalToken={portalToken} />
                    )}

                    {/* A landing-page step (Scale: bd-g2) approves a REAL page, not a wall
                        of copy: live preview of the auto-generated landing page at
                        /portal/[token]/landing (content slot "landing-page"). */}
                    {showsLandingPreview(journey, m.id) && portalToken && (
                      <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 20 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                          <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                            Your landing page — live preview
                          </div>
                          <a href={`/portal/${portalToken}/landing`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-act)", textDecoration: "none", whiteSpace: "nowrap" }}>
                            Open full page ↗
                          </a>
                        </div>
                        <div style={{ borderRadius: "var(--pj-radius-sm)", overflow: "hidden", border: "1px solid var(--pj-line)", background: "var(--pj-well)" }}>
                          <iframe src={`/portal/${portalToken}/landing`} title="Your landing page preview" style={{ display: "block", width: "100%", height: 560, border: 0 }} loading="lazy" />
                        </div>
                      </div>
                    )}

                    {/* Demo route only: a tiny way past the interview when presenting. */}
                    {m.interview && isDemo && (
                      <button
                        type="button"
                        onClick={() => {
                          approveMilestone(m.id, "Skipped in the demo.");
                          if (nextN) setMilestone(nextN);
                          else backToJourney();
                          window.scrollTo(0, 0);
                        }}
                        title="Skip the interview (demo only)"
                        style={{ position: "fixed", bottom: 22, right: 58, zIndex: 71, background: "transparent", border: "1px solid rgba(128,128,128,0.3)", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontFamily: "var(--font-body), sans-serif", color: "rgba(128,128,128,0.85)", cursor: "pointer" }}
                      >
                        Skip
                      </button>
                    )}

                    {twoWays && (
                      <button type="button" className="pj-answer-switch" onClick={() => switchMode("type")}>Rather type your answers?</button>
                    )}

                    {m.interview && (
                      <VoiceInterview
                        agentId={m.interviewAgentId}
                        questions={m.interview}
                        storageKey={`pjInterview:${portalToken ?? "demo"}:${m.id}`}
                        audioBase={interviewAudioBase(m.id)}
                        sound={voiceOn}
                        onChange={(transcript) => setNoteDrafts((prev) => (prev[m.id] === transcript ? prev : { ...prev, [m.id]: transcript }))}
                      />
                    )}

                    {m.notePrompt && (
                      <div style={{ marginTop: 16 }}>
                        <label style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                          {m.notePrompt}
                        </label>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder={m.notePlaceholder ?? "Optional — leave blank if it looks good."}
                          rows={3}
                          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", fontSize: 14, resize: "vertical", outline: "none" }}
                        />
                        <MicButton onText={(chunk) => setNoteDrafts((prev) => ({ ...prev, [m.id]: `${prev[m.id] ?? ""} ${chunk}`.trim() }))} />
                      </div>
                    )}
                  </div>
                )}

                {/* The interview keeps its page to the orb alone until there is an answer to hand in. */}
                {!hasCustomFlow && !(m.interview && m.status !== "done" && !noteValue.trim()) && (
                  <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 14, borderTop: "1px solid var(--pj-line)", paddingTop: 22 }}>
                    {!isFirst && (
                      <button onClick={() => prevN && setMilestone(prevN)} style={{ background: "transparent", border: "1px solid var(--pj-line)", color: "var(--pj-muted)", fontFamily: "var(--font-body), sans-serif", fontWeight: 550, fontSize: 14, borderRadius: "var(--pj-radius-sm)", padding: "12px 18px", cursor: "pointer" }}>
                        ← Previous
                      </button>
                    )}
                    <span style={{ marginLeft: isFirst ? 0 : "auto", fontSize: 12.5, color: "var(--pj-faint)" }}>
                      {m.status === "done"
                        ? "Completed"
                        : m.awaitingTeam
                          ? "With us. We’ll tick this off when it’s done."
                        : m.noteRequired && !noteValue.trim()
                          ? m.interview ? "Answer at least one question to continue" : "Fill in the field above to continue"
                          : m.interview ? "Ready when you are" : m.doneLabel ? "Tick this off when you’re done" : "Awaiting your approval"}
                    </span>
                    {m.status !== "done" && !m.awaitingTeam ? (
                      (() => {
                        const noteMissing = Boolean(m.noteRequired) && !noteValue.trim();
                        return (
                      <button
                        disabled={noteMissing}
                        onClick={() => {
                          if (noteMissing) return;
                          const completedStageId = stageCompletedBy(m.id);
                          approveMilestone(m.id, m.notePrompt || m.interview || mapHere ? noteValue : undefined);
                          if (completedStageId) {
                            setJustCompletedStageId(completedStageId);
                            setView("complete");
                            window.scrollTo(0, 0);
                          } else if (nextN) {
                            setMilestone(nextN);
                          } else {
                            backToJourney();
                          }
                        }}
                        style={{ marginLeft: isFirst ? "auto" : 0, background: noteMissing ? "var(--pj-act-fill)" : "var(--pj-btn-grad)", color: noteMissing ? "var(--pj-act)" : "var(--pj-act-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 650, fontSize: 15, border: "none", borderRadius: "var(--pj-radius-pill)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 9, cursor: noteMissing ? "default" : "pointer", boxShadow: noteMissing ? "none" : "var(--pj-shadow-btn)" }}
                      >
                        {m.interview ? "Finish interview" : m.doneLabel ? m.doneLabel : isLast ? "Approve & finish" : "Approve & continue"} <span style={{ fontSize: 17 }}>→</span>
                      </button>
                        );
                      })()
                    ) : (
                      <button
                        onClick={() => (isLast || !nextN ? backToJourney() : setMilestone(nextN))}
                        style={{ marginLeft: isFirst ? "auto" : 0, background: "transparent", border: "1px solid var(--pj-act)", color: "var(--pj-act)", fontFamily: "var(--font-body), sans-serif", fontWeight: 650, fontSize: 15, borderRadius: "var(--pj-radius-pill)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
                      >
                        {isLast ? "Back to journey" : "Next task"} <span style={{ fontSize: 17 }}>→</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {view === "complete" && justCompletedStageId && (() => {
        const idx = journeyStages.findIndex((s) => s.id === justCompletedStageId);
        const completed = journeyStages[idx];
        const next = idx >= 0 ? journeyStages[idx + 1] : undefined;
        if (!completed) return null;
        return (
          <StageCompleteView
            stageName={completed.name}
            totalTasks={completed.milestones.length}
            nextStage={next}
            nextIndex={idx + 2}
            totalStages={journeyStages.length}
            onContinue={backToJourney}
            onBackToJourney={backToJourney}
          />
        );
      })()}

      {/* walkthrough video modal */}
      {videoTitle && (
        <div onClick={closeVideo} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "var(--pj-scrim)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 920, borderRadius: 20, overflow: "hidden", background: "var(--pj-card)", border: "1px solid var(--pj-line)", boxShadow: "var(--pj-shadow-modal)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: "1px solid var(--pj-line-soft)" }}>
              <PlayIcon />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--pj-act)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Walkthrough</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginTop: 3 }}>{videoTitle}</div>
              </div>
              <button
                onClick={closeVideo}
                style={{ width: 34, height: 34, borderRadius: 99, background: "var(--pj-rail)", border: "1px solid var(--pj-line)", color: "var(--pj-ink)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <video ref={modalVideoRef} src={videoSrc} controls playsInline style={{ display: "block", width: "100%", aspectRatio: "16 / 9", background: "#000" }} />
          </div>
        </div>
      )}
    </div>
  );
}
