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
import { StageRail } from "@/app/components/portal/StageRail";
import { TaskRow } from "@/app/components/portal/TaskRow";
import { UpNextCard } from "@/app/components/portal/UpNextCard";
import { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

const teal = "#00b8a0";
const gold = "#f5a623";
const blue = "#6aa6f5";
const ink = "#08090c";
const text = "#eef1f6";

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
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("/portal/welcome-to-scale.mp4");

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

  // ---- Journey-redesign derived values (Phase 3) ----
  function dayLabelOf(stage: { dayStart: number; dayEnd: number }) {
    return stage.dayStart === stage.dayEnd ? `Day ${stage.dayStart}` : `Days ${stage.dayStart}–${stage.dayEnd}`;
  }
  // Maps the 3-state milestone model onto the 4-status display vocabulary.
  // "With us" comes from the explicit awaitingTeam content flag.
  function taskDisplayStatus(m: JourneyMilestone): TaskDisplayStatus {
    if (m.status === "done") return "done";
    if (m.status === "current") return m.awaitingTeam ? "with-us" : "your-turn";
    return m.awaitingTeam ? "with-us" : "up-next";
  }
  const stageDoneCount = currentStage ? currentStage.milestones.filter((m) => m.status === "done").length : 0;
  const stagePct =
    currentStage && currentStage.milestones.length
      ? Math.round((stageDoneCount / currentStage.milestones.length) * 100)
      : 0;
  const upNextCandidate = currentStage ? currentStage.milestones[firstOpenMilestoneIndex] : undefined;
  const upNext = upNextCandidate && taskDisplayStatus(upNextCandidate) === "your-turn" ? upNextCandidate : null;

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

  return (
    <div style={{ background: "var(--pj-bg)", color: "var(--pj-ink)", fontFamily: "var(--font-space-grotesk), system-ui, sans-serif", minHeight: "100vh" }}>
      <style>{`
        @keyframes portalPulse { 0% { transform: scale(1); opacity: 0.65; } 70% { transform: scale(2.2); opacity: 0; } 100% { opacity: 0; } }
        @keyframes viewIn { from { transform: translateY(18px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
        @keyframes soundPulse { 0%, 100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.06); } }
      `}</style>

      {/* TOP BAR */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "var(--pj-bg)",
          borderBottom: "1px solid var(--pj-line)",
          padding: "15px 28px",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--pj-ink)" }}>scale</span>
        <span style={{ width: 1, height: 18, background: "var(--pj-line)" }} />
        <span style={{ fontSize: 13, color: "var(--pj-muted)" }}>Client Portal{name ? ` · ${name}` : ""}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums" }}>
            Day {currentDay} / {journeyTotalDays} · <b style={{ color: "var(--pj-done)", fontWeight: 650 }}>on track</b>
          </span>
          <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--pj-act)", color: "var(--pj-act-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
            {name.charAt(0)}
          </div>
        </div>
      </div>

      {/* JOURNEY — home view */}
      {view === "home" && (
        <div style={{ display: "flex", alignItems: "stretch", minHeight: "calc(100vh - 61px)" }}>
          <StageRail stages={journeyStages} overallPercent={progress} onSelectStage={(stageId) => openM(stageId, 1)} />
          <section style={{ flex: 1, minWidth: 0, padding: "36px 44px 80px", maxWidth: 860 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-act)", marginBottom: 10 }}>
              Stage {currentStageIndex + 1} of {journeyStages.length}{currentStage ? ` · ${dayLabelOf(currentStage)}` : ""}
            </div>
            <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 8px" }}>
              {currentStage ? currentStage.name : "You’re all caught up"}
            </h2>
            <p style={{ color: "var(--pj-muted)", fontSize: 14.5, maxWidth: "56ch", margin: 0 }}>
              {currentStage?.blurb ?? "Everything we need from you is done — sit tight while we build."}
            </p>

            {currentStage && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 26px" }}>
                  <div style={{ flex: "0 0 220px", height: 6, borderRadius: 6, background: "#e7dccb", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${stagePct}%`, background: "var(--pj-done)", borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {stageDoneCount} / {currentStage.milestones.length} done
                  </span>
                  <button type="button" onClick={() => openVideo(`${currentStage.name} — full walkthrough`)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--pj-act)", fontWeight: 650, fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    ▸ Watch the walkthrough
                  </button>
                </div>

                <UpNextCard
                  title={upNext ? upNext.title : "We’re preparing your next step"}
                  desc={upNext ? upNext.detail : "Nothing needed from you right now — we’ll flag you the moment there’s something to review."}
                  actionable={!!upNext}
                  onStart={upNext ? () => openM(currentStage.id, firstOpenMilestoneIndex + 1) : undefined}
                />

                <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", margin: "0 0 10px" }}>
                  All tasks in this stage
                </div>
                <div style={{ background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-card)", overflow: "hidden" }}>
                  {currentStage.milestones.map((m, mi) => {
                    const ds = taskDisplayStatus(m);
                    return (
                      <div key={m.id} style={{ borderTop: mi === 0 ? "none" : "1px solid var(--pj-line-soft)" }}>
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
              </>
            )}
          </section>
        </div>
      )}

      {/* STAGE DETAIL */}
      {view === "stage" && viewingStage && (
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
