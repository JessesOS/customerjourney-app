"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  behindTheScenesItems,
  buildJourneyStages,
  completedStageCount,
  defaultCompletedMilestoneIds,
  defaultCurrentDay,
  journeyProgressPercent,
  journeyTotalDays,
  type JourneyMilestone,
} from "@/lib/onboardingJourney";
import { onboardingFormById } from "@/lib/onboardingForm";
import { OnboardingFormStepper } from "@/app/components/portal/OnboardingFormStepper";
import { PortalButton } from "@/app/components/portal/PortalButton";

const teal = "#00b8a0";
const gold = "#f5a623";
const blue = "#6aa6f5";
const ink = "#08090c";
const text = "#eef1f6";

type Phase = "intro" | "resolved";
type View = "home" | "stage";

export type UploadMeta = { fileName: string; uploadedAt: string };

export type ClientPortalExperienceProps = {
  name?: string;
  currentDay?: number;
  initialCompletedMilestoneIds?: string[];
  initialMilestoneNotes?: Record<string, string>;
  milestoneContent?: Record<string, string>;
  milestoneUploads?: Record<string, UploadMeta>;
  portalToken?: string;
};

function useDayTicks(currentDay: number) {
  const days = [];
  for (let i = 1; i <= 30; i++) {
    const major = i === 1 || i % 5 === 0;
    const current = i === currentDay;
    const past = i <= currentDay;
    const tickColor = current ? gold : past ? teal : "rgba(255,255,255,0.18)";
    days.push({
      n: i,
      label: major ? String(i) : "",
      labelColor: current ? gold : past ? "rgba(0,184,160,0.85)" : "rgba(238,241,246,0.3)",
      labelWeight: current ? 700 : 400,
      tickWidth: current ? 3 : major ? 2 : 1,
      tickHeight: current ? 17 : major ? 12 : 7,
      tickColor,
      glow: current ? "0 0 10px rgba(245,166,35,0.85)" : "none",
    });
  }
  return days;
}

function CheckIcon({ color = "#04130e", size = 13 }: { color?: string; size?: number }) {
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
          <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: "#6aa6f5", textDecoration: "underline" }}>
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function FormIcon({ color = gold, size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function LockIcon({ color = "rgba(238,241,246,0.4)", size = 10 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PlayIcon({ color = "#f5a623", fill }: { color?: string; fill?: string }) {
  return (
    <span style={{ width: 30, height: 30, borderRadius: 99, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={fill ?? "#1c1300"}>
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}

export function ClientPortalExperience({
  name = "Chris",
  currentDay = defaultCurrentDay,
  initialCompletedMilestoneIds = defaultCompletedMilestoneIds,
  initialMilestoneNotes = {},
  milestoneContent = {},
  milestoneUploads = {},
  portalToken,
}: ClientPortalExperienceProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [heroMounted, setHeroMounted] = useState(true);
  const [view, setView] = useState<View>("home");
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set(initialCompletedMilestoneIds));
  const [notes, setNotes] = useState<Record<string, string>>(initialMilestoneNotes);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, UploadMeta>>(milestoneUploads);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const journeyStages = useMemo(() => buildJourneyStages(completedIds, currentDay), [completedIds, currentDay]);

  const defaultStage = useMemo(() => journeyStages.find((s) => s.status === "current"), [journeyStages]);
  const defaultMilestoneIndex = defaultStage
    ? Math.max(0, defaultStage.milestones.findIndex((m) => m.status !== "done")) + 1
    : 1;

  const [milestone, setMilestone] = useState(defaultMilestoneIndex);
  const [viewingStageId, setViewingStageId] = useState<string>(defaultStage?.id ?? journeyStages[0].id);
  const [rtOpen, setRtOpen] = useState(false);
  const [showUnmute, setShowUnmute] = useState(false);
  const [showPlay, setShowPlay] = useState(false);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("/portal/welcome-to-scale.mp4");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const days = useDayTicks(currentDay);
  const progress = journeyProgressPercent(currentDay);
  const stagesDone = completedStageCount(journeyStages);
  const currentStageIndex = journeyStages.findIndex((s) => s.status === "current");
  const currentStage = currentStageIndex >= 0 ? journeyStages[currentStageIndex] : undefined;
  const firstOpenMilestoneIndex = currentStage
    ? Math.max(0, currentStage.milestones.findIndex((m) => m.status !== "done"))
    : 0;
  const viewingStageIndex = journeyStages.findIndex((s) => s.id === viewingStageId);
  const viewingStage = viewingStageIndex >= 0 ? journeyStages[viewingStageIndex] : undefined;

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

  function uploadFile(milestoneId: string, file: File) {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please choose a .csv file.");
      return;
    }
    if (file.size > 1_000_000) {
      setUploadError("That file is too large — please keep it under 1MB.");
      return;
    }

    setUploadingId(milestoneId);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      if (!portalToken) {
        setUploadingId(null);
        setUploads((prev) => ({ ...prev, [milestoneId]: { fileName: file.name, uploadedAt: new Date().toISOString() } }));
        approveMilestone(milestoneId);
        return;
      }
      fetch(`/api/portal/${portalToken}/upload/${milestoneId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, content }),
      })
        .then((res) => res.json())
        .then((payload: { ok: boolean; error?: string }) => {
          if (!payload.ok) {
            setUploadError(payload.error ?? "Could not upload the file.");
            return;
          }
          setUploads((prev) => ({ ...prev, [milestoneId]: { fileName: file.name, uploadedAt: new Date().toISOString() } }));
          approveMilestone(milestoneId);
        })
        .catch(() => setUploadError("Could not reach the server."))
        .finally(() => setUploadingId(null));
    };
    reader.onerror = () => {
      setUploadError("Could not read that file.");
      setUploadingId(null);
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem("scaleIntroSeen") === "1";
    } catch {}
    if (seen) {
      setPhase("resolved");
      setHeroMounted(false);
    } else {
      document.body.style.overflow = "hidden";
      const t = setTimeout(initVideo, 80);
      timers.current.push(t);
    }
    return () => {
      timers.current.forEach(clearTimeout);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initVideo() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    try {
      v.currentTime = 0;
    } catch {}
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        v.muted = true;
        v.play()
          .then(() => setShowUnmute(true))
          .catch(() => setShowPlay(true));
      });
    }
  }

  function unmute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    try {
      v.currentTime = 0;
    } catch {}
    v.play();
    setShowUnmute(false);
  }

  function startWithSound() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    try {
      v.currentTime = 0;
    } catch {}
    v.play();
    setShowPlay(false);
    setShowUnmute(false);
  }

  function resolve() {
    setPhase("resolved");
    setShowUnmute(false);
    setShowPlay(false);
    document.body.style.overflow = "";
    try {
      localStorage.setItem("scaleIntroSeen", "1");
    } catch {}
    const t = setTimeout(() => setHeroMounted(false), 1200);
    timers.current.push(t);
  }

  function skip() {
    videoRef.current?.pause();
    resolve();
  }

  function replay() {
    document.body.style.overflow = "hidden";
    setHeroMounted(false);
    setPhase("intro");
    setShowUnmute(false);
    setShowPlay(false);
    const t1 = setTimeout(() => {
      setHeroMounted(true);
      const t2 = setTimeout(initVideo, 90);
      timers.current.push(t2);
    }, 90);
    timers.current.push(t1);
  }

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

  function openVideo(title: string, src: string = "/portal/welcome-to-scale.mp4") {
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

  const intro = phase === "intro";
  const resolved = phase === "resolved";

  return (
    <div style={{ background: ink, color: text, fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", minHeight: "100vh" }}>
      <style>{`
        @keyframes portalPulse { 0% { transform: scale(1); opacity: 0.65; } 70% { transform: scale(2.2); opacity: 0; } 100% { opacity: 0; } }
        @keyframes viewIn { from { transform: translateY(18px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        @keyframes soundPulse { 0%, 100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.06); } }
      `}</style>

      {/* HERO BAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 30,
          overflow: "hidden",
          height: intro ? "100vh" : 60,
          minHeight: intro ? 560 : 60,
          background: intro ? "#07080c" : "#111827",
          transition: "height 0.95s cubic-bezier(0.7,0,0.2,1), background 0.6s ease",
        }}
      >
        {heroMounted && (
          <div style={{ position: "absolute", inset: 0 }}>
            <video
              ref={videoRef}
              src="/portal/welcome-to-scale.mp4"
              playsInline
              preload="auto"
              onEnded={resolve}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#07080c" }}
            />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, background: "linear-gradient(180deg, transparent, #08090c)", pointerEvents: "none" }} />

            {showUnmute && (
              <button
                onClick={unmute}
                style={{
                  position: "absolute", left: "50%", bottom: 84, zIndex: 6, display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(8,9,12,0.7)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 99, padding: "12px 22px",
                  color: text, fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 15, cursor: "pointer",
                  boxShadow: "0 12px 44px rgba(0,0,0,0.55)", animation: "soundPulse 2.2s ease-in-out infinite", transform: "translateX(-50%)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
                </svg>
                Tap for sound
              </button>
            )}

            {showPlay && (
              <button
                onClick={startWithSound}
                style={{
                  position: "absolute", inset: 0, zIndex: 6, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 20, background: "rgba(7,8,12,0.45)", border: "none", cursor: "pointer", color: text,
                }}
              >
                <div style={{ width: 92, height: 92, borderRadius: 99, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill={text}><path d="M8 5v14l11-7z" /></svg>
                </div>
                <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 18 }}>Play your welcome</span>
              </button>
            )}
          </div>
        )}

        {intro && (
          <button
            onClick={skip}
            style={{
              position: "absolute", top: 24, right: 28, zIndex: 7, display: "flex", alignItems: "center", gap: 8,
              background: "rgba(8,9,12,0.5)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 99, padding: "8px 16px",
              color: "rgba(238,241,246,0.75)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, cursor: "pointer",
            }}
          >
            Skip intro
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        )}

        {/* collapsed strip */}
        <div
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 60, display: "flex", alignItems: "center", padding: "0 28px",
            opacity: resolved ? 1 : 0, transition: "opacity 0.5s ease 0.3s", pointerEvents: resolved ? "auto" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>scale</span>
            <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.14)" }} />
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.5)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Onboarding
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: teal, border: "1px solid rgba(0,184,160,0.4)", borderRadius: 99, padding: "5px 12px" }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: teal, boxShadow: `0 0 8px ${teal}` }} />
              On track
            </span>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)" }}>
              Day {currentDay} / {journeyTotalDays}
            </span>
            <button
              onClick={replay}
              title="Replay the welcome"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "6px 12px", color: "rgba(238,241,246,0.7)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, cursor: "pointer" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" />
              </svg>
              Replay
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 99, background: `linear-gradient(135deg, ${teal}, ${blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#05140f" }}>
                {name.charAt(0)}
              </div>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* JOURNEY — home view */}
      {resolved && view === "home" && (
        <section style={{ maxWidth: 880, margin: "0 auto", padding: "56px 32px 130px" }}>
          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: teal, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 16 }}>
            Your 30-day onboarding
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 44, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.05 }}>
            You&apos;re on your way, {name}.
          </h2>
          <p style={{ fontWeight: 400, fontSize: 19, color: "rgba(238,241,246,0.58)", marginTop: 16, maxWidth: 600, lineHeight: 1.5 }}>
            {stagesDone} stage{stagesDone === 1 ? "" : "s"} down. Here&apos;s everything between you and going live — one milestone at a time.
          </p>

          {/* progress card */}
          <div
            style={{
              marginTop: 42, borderRadius: 24, padding: "32px 36px",
              background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px -40px rgba(0,0,0,0.85)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Progress
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 15, color: "rgba(238,241,246,0.5)" }}>Day</span>
                  <span style={{ fontWeight: 800, fontSize: 66, lineHeight: 0.85, letterSpacing: "-0.03em" }}>{currentDay}</span>
                  <span style={{ fontWeight: 500, fontSize: 28, color: "rgba(238,241,246,0.45)" }}>/ {journeyTotalDays}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 42, lineHeight: 1, color: teal }}>{progress}%</div>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)", marginTop: 8 }}>
                  {stagesDone} of {journeyStages.length} stages complete
                </div>
              </div>
            </div>

            <div style={{ marginTop: 34, position: "relative" }}>
              <div style={{ display: "flex", gap: 4, height: 12 }}>
                {journeyStages.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      flex: s.dayEnd - s.dayStart + 1,
                      borderRadius: 6,
                      background: s.status === "done" ? teal : s.status === "current" ? gold : "#1f2430",
                      boxShadow: s.status === "current" ? "0 0 18px rgba(245,166,35,0.6)" : "none",
                    }}
                  />
                ))}
              </div>

              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
                  {days.map((d) => (
                    <div key={d.n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, lineHeight: "12px", height: 12, color: d.labelColor, fontWeight: d.labelWeight }}>
                        {d.label}
                      </div>
                      <div style={{ width: d.tickWidth, height: d.tickHeight, borderRadius: 2, background: d.tickColor, boxShadow: d.glow }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.16em", color: "rgba(238,241,246,0.32)", textTransform: "uppercase" }}>
                  <span>Day 1 · Kickoff</span>
                  <span>Day 30 · Go live</span>
                </div>
              </div>
            </div>

            <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 13, color: "rgba(238,241,246,0.5)", marginTop: 20, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: teal }} />
              You&apos;re right on pace — keep the momentum going.
            </div>
          </div>

          {/* stage list */}
          <div style={{ marginTop: 48 }}>
            <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 24 }}>
              The journey · {journeyStages.length} stages
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 21, top: 28, bottom: 28, width: 2, background: `linear-gradient(180deg, ${teal} 0%, ${teal} 22%, ${gold} 36%, rgba(255,255,255,0.13) 50%, rgba(255,255,255,0.09) 100%)` }} />

              {journeyStages.map((stage, idx) => {
                const dayLabel = stage.dayStart === stage.dayEnd ? `Day ${stage.dayStart}` : `Days ${stage.dayStart}–${stage.dayEnd}`;
                const num = String(idx + 1).padStart(2, "0");

                if (stage.status === "done") {
                  return (
                    <div key={stage.id} style={{ display: "flex", gap: 22, marginBottom: 14, position: "relative" }}>
                      <div style={{ width: 44, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 19 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 99, background: teal, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${ink}` }}>
                          <CheckIcon />
                        </div>
                      </div>
                      <div
                        onClick={() => openM(stage.id, 1)}
                        style={{ flex: 1, borderRadius: 16, padding: "16px 22px", background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 18, cursor: "pointer" }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: teal, letterSpacing: "0.14em" }}>STAGE {num}</div>
                          <div style={{ fontWeight: 600, fontSize: 19, marginTop: 5 }}>{stage.name}</div>
                        </div>
                        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)" }}>{dayLabel}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: teal, border: "1px solid rgba(0,184,160,0.35)", borderRadius: 99, padding: "6px 12px" }}>
                          <CheckIcon color={teal} size={11} />
                          Completed
                        </div>
                      </div>
                    </div>
                  );
                }

                if (stage.status === "current") {
                  const doneCount = stage.milestones.filter((m) => m.status === "done").length;
                  return (
                    <div key={stage.id} style={{ display: "flex", gap: 22, marginBottom: 14, position: "relative" }}>
                      <div style={{ width: 44, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 26 }}>
                        <div style={{ position: "relative", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ position: "absolute", inset: 0, borderRadius: 99, border: `2px solid ${gold}`, animation: "portalPulse 2.4s ease-out infinite" }} />
                          <div style={{ width: 30, height: 30, borderRadius: 99, background: gold, boxShadow: `0 0 0 4px ${ink}, 0 0 22px rgba(245,166,35,0.7)` }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, borderRadius: 22, padding: "28px 30px", background: "linear-gradient(180deg, rgba(245,166,35,0.10), rgba(245,166,35,0.02))", border: "1px solid rgba(245,166,35,0.5)", boxShadow: "0 0 70px -18px rgba(245,166,35,0.55)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: gold, letterSpacing: "0.14em" }}>STAGE {num}</span>
                          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: gold, textTransform: "uppercase", background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.45)", borderRadius: 99, padding: "5px 10px", letterSpacing: "0.1em" }}>
                            In progress
                          </span>
                          <span style={{ marginLeft: "auto", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)" }}>{dayLabel}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 27, marginTop: 14, letterSpacing: "-0.015em" }}>{stage.name}</div>
                        <div style={{ fontWeight: 400, fontSize: 15, color: "rgba(238,241,246,0.6)", marginTop: 8, maxWidth: 540, lineHeight: 1.5 }}>{stage.blurb}</div>

                        <PortalButton
                          variant="ghost"
                          onClick={() => openVideo(`${stage.name} — full walkthrough`)}
                          style={{ marginTop: 18, gap: 11, paddingLeft: 8 }}
                        >
                          <PlayIcon />
                          Watch the 2-min walkthrough
                        </PortalButton>

                        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 13 }}>
                          {stage.milestones.map((m, mi) => (
                            <div
                              key={m.id}
                              onClick={() => openM(stage.id, mi + 1)}
                              style={{ display: "flex", alignItems: "center", gap: 13, cursor: "pointer", margin: "-6px -10px", padding: "6px 10px", borderRadius: 10 }}
                            >
                              {m.status === "done" ? (
                                <div style={{ width: 22, height: 22, borderRadius: 99, background: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <CheckIcon size={11} />
                                </div>
                              ) : (
                                <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid rgba(245,166,35,0.7)`, flexShrink: 0 }} />
                              )}
                              <span
                                style={{
                                  fontWeight: m.status === "done" ? 400 : 500,
                                  fontSize: 15,
                                  color: m.status === "done" ? "rgba(238,241,246,0.5)" : text,
                                  textDecoration: m.status === "done" ? "line-through" : "none",
                                  textDecorationColor: "rgba(238,241,246,0.3)",
                                }}
                              >
                                {m.title}
                              </span>
                            </div>
                          ))}
                        </div>

                        {stage.statusNotes.length > 0 && (
                          <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                            {stage.statusNotes.map((note) => (
                              <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "rgba(238,241,246,0.5)", marginBottom: 4 }}>
                                <span style={{ color: teal, marginTop: 2 }}>●</span> {note}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                          <PortalButton
                            variant="primary"
                            onClick={() => openM(stage.id, firstOpenMilestoneIndex + 1)}
                          >
                            Continue Stage {idx + 1} <span style={{ fontSize: 17 }}>→</span>
                          </PortalButton>
                          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)" }}>
                            {doneCount} of {stage.milestones.length} milestones done · {stage.milestones.length - doneCount} to go
                          </span>
                          <PortalButton
                            variant="outline"
                            onClick={() => openM(stage.id, stage.milestones.length)}
                            title="If you've already finished this stage's work"
                            style={{ marginLeft: "auto", gap: 7 }}
                          >
                            Done early? Skip ahead <span style={{ fontSize: 14 }}>→</span>
                          </PortalButton>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={stage.id} style={{ display: "flex", gap: 22, marginBottom: idx < journeyStages.length - 1 ? 14 : 0, position: "relative" }}>
                    <div style={{ width: 44, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 19 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 99, background: "#161a22", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${ink}` }}>
                        <LockIcon />
                      </div>
                    </div>
                    <div
                      onClick={() => openM(stage.id, 1)}
                      style={{ flex: 1, borderRadius: 16, padding: "16px 22px", background: "rgba(255,255,255,0.012)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 18, opacity: 0.62, cursor: "pointer" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.35)", letterSpacing: "0.14em" }}>STAGE {num}</div>
                        <div style={{ fontWeight: 600, fontSize: 18, color: "rgba(238,241,246,0.62)", marginTop: 5 }}>{stage.name}</div>
                      </div>
                      <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.3)" }}>{dayLabel}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 99, padding: "6px 11px" }}>
                        <LockIcon />
                        Preview
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* behind the scenes */}
          <div style={{ marginTop: 44, borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.015)", overflow: "hidden" }}>
            <button
              onClick={() => setRtOpen(!rtOpen)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "24px 28px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", color: text }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: teal, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 7 }}>
                  Behind the scenes
                </div>
                <div style={{ fontWeight: 600, fontSize: 21, letterSpacing: "-0.01em" }}>What RT Digital is building for you</div>
              </div>
              <div style={{ transform: rtOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(238,241,246,0.55)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>
            {rtOpen && (
              <div style={{ padding: "4px 28px 28px" }}>
                <p style={{ fontWeight: 400, fontSize: 15, color: "rgba(238,241,246,0.58)", margin: "0 0 22px", maxWidth: 620, lineHeight: 1.55 }}>
                  While you work through your milestones, here&apos;s the engine we&apos;re wiring up in parallel — so the day you go live, everything&apos;s already running.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {behindTheScenesItems.map((item) => {
                    const color = item.state === "Live" ? teal : item.state === "Building" ? gold : "rgba(238,241,246,0.3)";
                    return (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 99, background: color, boxShadow: item.state !== "Queued" ? `0 0 10px ${color}` : "none", flexShrink: 0 }} />
                        <div style={{ flex: 1, fontWeight: 500, fontSize: 16, color: item.state === "Queued" ? "rgba(238,241,246,0.7)" : text }}>
                          {item.label} <span style={{ color: "rgba(238,241,246,0.45)", fontWeight: 400 }}>— {item.detail}</span>
                        </div>
                        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color, border: `1px solid ${color}66`, borderRadius: 99, padding: "5px 11px" }}>
                          {item.state}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* STAGE DETAIL */}
      {resolved && view === "stage" && viewingStage && (
        <section style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 32px 130px", animation: "viewIn 0.5s cubic-bezier(0.2,0.7,0.2,1)" }}>
          <button
            onClick={backToJourney}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "rgba(238,241,246,0.55)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, letterSpacing: "0.06em", cursor: "pointer", padding: 0, marginBottom: 28 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Back to journey
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: viewingStage.status === "done" ? teal : gold, letterSpacing: "0.14em" }}>
              STAGE {String(viewingStageIndex + 1).padStart(2, "0")}
            </span>
            {viewingStage.status === "done" ? (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: teal, textTransform: "uppercase", background: "rgba(0,184,160,0.14)", border: "1px solid rgba(0,184,160,0.45)", borderRadius: 99, padding: "5px 10px", letterSpacing: "0.1em" }}>
                Completed
              </span>
            ) : viewingStage.status === "current" ? (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: gold, textTransform: "uppercase", background: "rgba(245,166,35,0.14)", border: "1px solid rgba(245,166,35,0.45)", borderRadius: 99, padding: "5px 10px", letterSpacing: "0.1em" }}>
                In progress
              </span>
            ) : (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "rgba(238,241,246,0.5)", textTransform: "uppercase", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 99, padding: "5px 10px", letterSpacing: "0.1em" }}>
                Preview
              </span>
            )}
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.5)" }}>
              {viewingStage.dayStart === viewingStage.dayEnd ? `Day ${viewingStage.dayStart}` : `Days ${viewingStage.dayStart}–${viewingStage.dayEnd}`}
            </span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 38, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.05 }}>{viewingStage.name}</h2>
          <p style={{ fontWeight: 400, fontSize: 18, color: "rgba(238,241,246,0.58)", marginTop: 14, maxWidth: 620, lineHeight: 1.5 }}>
            {viewingStage.blurb}
          </p>

          {viewingStage.statusNotes.length > 0 && (
            <div style={{ marginTop: 20, maxWidth: 620, padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
              {viewingStage.statusNotes.map((note) => (
                <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: "rgba(238,241,246,0.5)", marginBottom: 4 }}>
                  <span style={{ color: teal, marginTop: 2 }}>●</span> {note}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 34, marginTop: 40, alignItems: "start" }}>
            <aside style={{ position: "sticky", top: 84, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.45)", letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 10px 4px" }}>
                {viewingStage.milestones.length} milestones
              </div>
              {viewingStage.milestones.map((m, i) => {
                const active = milestone === i + 1;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMilestone(i + 1)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 12,
                      cursor: "pointer", textAlign: "left", color: text, fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                      background: active ? "rgba(245,166,35,0.10)" : "transparent",
                      border: active ? "1px solid rgba(245,166,35,0.45)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {m.status === "done" ? (
                      <div style={{ width: 26, height: 26, borderRadius: 99, background: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <CheckIcon />
                      </div>
                    ) : (
                      <div style={{ width: 26, height: 26, borderRadius: 99, border: active ? `2px solid ${gold}` : "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: active ? gold : "rgba(238,241,246,0.5)", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, fontWeight: active ? 600 : 400 }}>
                        {i + 1}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: m.status === "done" ? "rgba(238,241,246,0.45)" : active ? gold : "rgba(238,241,246,0.4)", letterSpacing: "0.1em" }}>
                        STEP {i + 1} {m.status === "done" ? "· DONE" : active ? "· NOW" : ""}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 15, marginTop: 2, color: m.status === "upcoming" && !active ? "rgba(238,241,246,0.75)" : text }}>
                        {m.title}
                        {m.formId && m.status !== "done" && <FormIcon color={active ? gold : "rgba(238,241,246,0.4)"} />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </aside>

            <main style={{ minHeight: 420 }}>
              {(() => {
                const m: JourneyMilestone | undefined = viewingStage.milestones[milestone - 1];
                if (!m) return null;
                const isLast = milestone === viewingStage.milestones.length;
                const isFirst = milestone === 1;
                const label = m.status === "done" ? "Reviewed & approved" : "Review & approve";
                const inlineForm = m.status !== "done" && m.formId ? onboardingFormById(m.formId) : undefined;
                const savedContent = milestoneContent[m.id];
                const noteValue = noteDrafts[m.id] ?? notes[m.id] ?? "";
                const uploadMeta = uploads[m.id];
                const showUploadWidget = m.status !== "done" && m.hasUpload;
                const hasCustomFlow = Boolean(inlineForm) || showUploadWidget;

                return (
                  <div style={{ animation: "viewIn 0.35s ease" }}>
                    <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: m.status === "done" ? "rgba(238,241,246,0.45)" : gold, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      Milestone {milestone} · {label}
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 26, margin: "10px 0 0", letterSpacing: "-0.02em" }}>{m.title}</h3>
                    <p style={{ fontWeight: 400, fontSize: 15, color: "rgba(238,241,246,0.6)", marginTop: 8, maxWidth: 580, lineHeight: 1.55 }}>
                      {m.detail}
                    </p>

                    {m.videoUrl && (
                      <button
                        onClick={() => openVideo(m.title, m.videoUrl)}
                        style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 99, padding: "7px 16px 7px 7px", color: text, fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 500, fontSize: 13, cursor: "pointer" }}
                      >
                        <PlayIcon />
                        Watch how it works
                      </button>
                    )}

                    {m.status === "done" ? (
                      <div style={{ marginTop: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14, border: "1px solid rgba(0,184,160,0.35)", background: "rgba(0,184,160,0.07)", padding: "16px 18px" }}>
                          <div style={{ width: 24, height: 24, borderRadius: 99, background: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <CheckIcon size={12} />
                          </div>
                          <div style={{ flex: 1, fontSize: 14, color: text }}>You&apos;ve completed this milestone.</div>
                        </div>
                        {savedContent && (
                          <div style={{ marginTop: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "16px 18px" }}>
                            {savedContent.split("\n").filter(Boolean).map((line, i) => (
                              <p key={i} style={{ fontSize: 14, color: text, margin: i === 0 ? 0 : "8px 0 0", lineHeight: 1.6 }}><LinkifiedLine line={line} /></p>
                            ))}
                          </div>
                        )}
                        {notes[m.id] && (
                          <div style={{ marginTop: 14, fontSize: 13, color: "rgba(238,241,246,0.55)" }}>
                            <span style={{ color: gold }}>Your note:</span> {notes[m.id]}
                          </div>
                        )}
                        {uploadMeta && (
                          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(238,241,246,0.55)" }}>
                            <span style={{ color: gold }}>Uploaded:</span> {uploadMeta.fileName}
                          </div>
                        )}
                      </div>
                    ) : inlineForm ? (
                      <OnboardingFormStepper
                        form={inlineForm}
                        portalToken={portalToken}
                        onComplete={() => {
                          approveMilestone(m.id);
                          if (!isLast) setMilestone(milestone + 1);
                        }}
                      />
                    ) : showUploadWidget ? (
                      <div style={{ marginTop: 24, borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: 22 }}>
                        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: gold, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
                          Upload your file
                        </div>
                        <label
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            border: "1.5px dashed rgba(255,255,255,0.2)", borderRadius: 14, padding: "28px 20px",
                            cursor: uploadingId === m.id ? "default" : "pointer", color: "rgba(238,241,246,0.7)",
                            fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 14,
                          }}
                        >
                          <input
                            type="file"
                            accept=".csv"
                            disabled={uploadingId === m.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadFile(m.id, file);
                              e.target.value = "";
                            }}
                            style={{ display: "none" }}
                          />
                          {uploadingId === m.id ? "Uploading…" : "Click to choose a .csv file"}
                        </label>
                        {uploadError && <div style={{ marginTop: 12, fontSize: 13, color: "#ff9a90" }}>{uploadError}</div>}
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginTop: 24, borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: 22 }}>
                          <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: gold, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
                            {m.hasEditableContent ? "For your review" : "What we need from you"}
                          </div>
                          {m.hasEditableContent ? (
                            savedContent ? (
                              savedContent.split("\n").filter(Boolean).map((line, i) => (
                                <p key={i} style={{ fontSize: 15, color: text, lineHeight: 1.6, margin: i === 0 ? 0 : "10px 0 0" }}><LinkifiedLine line={line} /></p>
                              ))
                            ) : (
                              <p style={{ fontSize: 15, color: "rgba(238,241,246,0.5)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
                                Your account team is finalizing these — check back soon.
                              </p>
                            )
                          ) : (
                            <p style={{ fontSize: 15, color: text, lineHeight: 1.6, margin: 0 }}>{m.detail}</p>
                          )}
                        </div>

                        {m.notePrompt && (
                          <div style={{ marginTop: 16 }}>
                            <label style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                              {m.notePrompt}
                            </label>
                            <textarea
                              value={noteValue}
                              onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                              placeholder="Optional — leave blank if it looks good."
                              rows={3}
                              style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.03)", color: text, fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", fontSize: 14, resize: "vertical", outline: "none" }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {!hasCustomFlow && (
                    <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 14, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 22 }}>
                      {!isFirst && (
                        <button onClick={() => setMilestone(milestone - 1)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(238,241,246,0.7)", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 500, fontSize: 14, borderRadius: 12, padding: "12px 18px", cursor: "pointer" }}>
                          ← Previous
                        </button>
                      )}
                      <span style={{ marginLeft: isFirst ? 0 : "auto", fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "rgba(238,241,246,0.45)" }}>
                        {m.status === "done" ? "Completed" : "Awaiting your approval"}
                      </span>
                      {m.status !== "done" && (
                        <button
                          onClick={() => {
                            approveMilestone(m.id, m.notePrompt ? noteValue : undefined);
                            if (!isLast) setMilestone(milestone + 1);
                          }}
                          style={{ marginLeft: isFirst ? "auto" : 0, background: gold, color: "#1c1300", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 15, border: "none", borderRadius: 12, padding: "13px 22px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
                        >
                          {isLast ? "Approve" : "Approve & continue"} <span style={{ fontSize: 17 }}>→</span>
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                );
              })()}
            </main>
          </div>
        </section>
      )}

      {/* walkthrough video modal */}
      {videoTitle && (
        <div onClick={closeVideo} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "rgba(4,5,8,0.82)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 920, borderRadius: 20, overflow: "hidden", background: "#0d1016", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <PlayIcon />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: gold, letterSpacing: "0.16em", textTransform: "uppercase" }}>Walkthrough</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginTop: 3 }}>{videoTitle}</div>
              </div>
              <button
                onClick={closeVideo}
                style={{ width: 34, height: 34, borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
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
