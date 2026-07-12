"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildJourneyStages,
  defaultCompletedMilestoneIds,
  defaultCurrentDay,
  journeyProgressPercent,
  journeyTemplate,
  journeyTotalDays,
  type JourneyMilestone,
} from "@/lib/onboardingJourney";
import { onboardingFormById } from "@/lib/onboardingForm";
import { OnboardingFormStepper } from "@/app/components/portal/OnboardingFormStepper";
import { StageRail } from "@/app/components/portal/StageRail";
import { TaskRow } from "@/app/components/portal/TaskRow";
import { UpNextCard } from "@/app/components/portal/UpNextCard";
import { StageCompleteView } from "@/app/components/portal/StageCompleteView";
import { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

const teal = "#00b8a0";
const gold = "#f5a623";
const ink = "#08090c";
const text = "#eef1f6";

type View = "home" | "stage" | "complete";

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
  const [justCompletedStageId, setJustCompletedStageId] = useState<string | null>(null);
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

  const progress = journeyProgressPercent(currentDay);
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

  // Returns the stage id if approving `milestoneId` completes its whole stage.
  function stageCompletedBy(milestoneId: string): string | null {
    const stage = journeyTemplate.find((s) => s.milestones.some((mm) => mm.id === milestoneId));
    if (!stage) return null;
    const willAllBeDone = stage.milestones
      .filter((mm) => !mm.hidden)
      .every((mm) => mm.id === milestoneId || completedIds.has(mm.id));
    return willAllBeDone ? stage.id : null;
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
        advanceAfterComplete(milestoneId);
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
          advanceAfterComplete(milestoneId);
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
    if (stage && idx >= 0 && idx < stage.milestones.length - 1) {
      setMilestone(idx + 2);
      window.scrollTo(0, 0);
    } else {
      backToJourney();
    }
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
    <div style={{ background: "var(--pj-bg)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", minHeight: "100vh" }}>
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
      </div>

      {/* JOURNEY — home view */}
      {view === "home" && (
        <div className="pj-home">
          <div className="pj-rail-desktop">
            <StageRail stages={journeyStages} overallPercent={progress} onSelectStage={(stageId) => openM(stageId, 1)} />
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
                      background: s.status === "done" ? "var(--pj-done)" : s.status === "current" ? "var(--pj-act)" : "#e7dccb",
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
            <h2 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 32, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 8px" }}>
              {currentStage ? currentStage.name : "You’re all caught up"}
            </h2>
            <p style={{ color: "var(--pj-muted)", fontSize: 14.5, maxWidth: "56ch", margin: 0 }}>
              {currentStage?.blurb ?? "Everything we need from you is done — sit tight while we build."}
            </p>

            {currentStage && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 26px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 160px", maxWidth: 220, height: 6, borderRadius: 6, background: "#e7dccb", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${stagePct}%`, background: "var(--pj-done)", borderRadius: 6 }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums" }}>
                    {stageDoneCount} / {currentStage.milestones.length} done
                  </span>
                  <button type="button" onClick={() => openVideo(`${currentStage.name} — full walkthrough`)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--pj-act)", fontWeight: 650, fontFamily: "var(--font-body), sans-serif" }}>
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
        <section style={{ maxWidth: 680, margin: "0 auto", padding: "40px 32px 96px", animation: "viewIn 0.4s cubic-bezier(0.2,0.7,0.2,1)" }}>
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
            const isLast = milestone === viewingStage.milestones.length;
            const isFirst = milestone === 1;
            const inlineForm = m.status !== "done" && m.formId ? onboardingFormById(m.formId) : undefined;
            const savedContent = milestoneContent[m.id];
            const noteValue = noteDrafts[m.id] ?? notes[m.id] ?? "";
            const uploadMeta = uploads[m.id];
            const showUploadWidget = m.status !== "done" && m.hasUpload;
            const hasCustomFlow = Boolean(inlineForm) || showUploadWidget;

            return (
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-act)", marginBottom: 12 }}>
                  {viewingStage.name} · Task {milestone} of {viewingStage.milestones.length}
                </div>
                <h3 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 30, fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 10px" }}>{m.title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--pj-muted)", margin: 0, maxWidth: "54ch", lineHeight: 1.55 }}>{m.detail}</p>

                {m.videoUrl && (
                  <button
                    onClick={() => openVideo(m.title, m.videoUrl)}
                    style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 10, background: "var(--pj-card)", border: "1px solid var(--pj-line)", borderRadius: "var(--pj-radius-pill)", padding: "7px 16px 7px 7px", color: "var(--pj-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 550, fontSize: 13, cursor: "pointer" }}
                  >
                    <PlayIcon color="#d97757" />
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

                {m.important && (
                  <div style={{ marginTop: 18, display: "flex", gap: 11, borderRadius: "var(--pj-radius-sm)", border: "1px solid rgba(217,119,87,0.4)", background: "var(--pj-act-fill)", padding: "13px 16px" }}>
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
                    {savedContent && (
                      <div style={{ marginTop: 14, borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: "16px 18px" }}>
                        {savedContent.split("\n").filter(Boolean).map((line, i) => (
                          <p key={i} style={{ fontSize: 14, color: "var(--pj-ink)", margin: i === 0 ? 0 : "8px 0 0", lineHeight: 1.6 }}><LinkifiedLine line={line} /></p>
                        ))}
                      </div>
                    )}
                    {notes[m.id] && (
                      <div style={{ marginTop: 14, fontSize: 13, color: "var(--pj-muted)" }}>
                        <span style={{ color: "var(--pj-act)", fontWeight: 600 }}>Your note:</span> {notes[m.id]}
                      </div>
                    )}
                    {uploadMeta && (
                      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--pj-muted)" }}>
                        <span style={{ color: "var(--pj-act)", fontWeight: 600 }}>Uploaded:</span> {uploadMeta.fileName}
                      </div>
                    )}
                  </div>
                ) : inlineForm ? (
                  <OnboardingFormStepper
                    form={inlineForm}
                    portalToken={portalToken}
                    onComplete={() => {
                      approveMilestone(m.id);
                      advanceAfterComplete(m.id);
                    }}
                  />
                ) : showUploadWidget ? (
                  <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 22 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 12 }}>
                      Upload your file
                    </div>
                    <label
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        border: "1.5px dashed var(--pj-line)", borderRadius: "var(--pj-radius-sm)", padding: "28px 20px",
                        cursor: uploadingId === m.id ? "default" : "pointer", color: "var(--pj-muted)",
                        fontFamily: "var(--font-body), sans-serif", fontSize: 14,
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
                    {uploadError && <div style={{ marginTop: 12, fontSize: 13, color: "var(--pj-act)" }}>{uploadError}</div>}
                  </div>
                ) : m.bookingUrl ? (
                  <div style={{ marginTop: 24, borderRadius: "var(--pj-radius-card)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                        Book your call
                      </div>
                      <a href={m.bookingUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--pj-act)", textDecoration: "none", whiteSpace: "nowrap" }}>
                        Open in a new tab ↗
                      </a>
                    </div>
                    <div style={{ borderRadius: "var(--pj-radius-sm)", overflow: "hidden", border: "1px solid var(--pj-line)", background: "#faf7f2" }}>
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

                    {m.notePrompt && (
                      <div style={{ marginTop: 16 }}>
                        <label style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)" }}>
                          {m.notePrompt}
                        </label>
                        <textarea
                          value={noteValue}
                          onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder="Optional — leave blank if it looks good."
                          rows={3}
                          style={{ width: "100%", marginTop: 8, padding: "12px 14px", borderRadius: "var(--pj-radius-sm)", border: "1px solid var(--pj-line)", background: "var(--pj-card)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", fontSize: 14, resize: "vertical", outline: "none" }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {!hasCustomFlow && (
                  <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 14, borderTop: "1px solid var(--pj-line)", paddingTop: 22 }}>
                    {!isFirst && (
                      <button onClick={() => setMilestone(milestone - 1)} style={{ background: "transparent", border: "1px solid var(--pj-line)", color: "var(--pj-muted)", fontFamily: "var(--font-body), sans-serif", fontWeight: 550, fontSize: 14, borderRadius: "var(--pj-radius-sm)", padding: "12px 18px", cursor: "pointer" }}>
                        ← Previous
                      </button>
                    )}
                    <span style={{ marginLeft: isFirst ? 0 : "auto", fontSize: 12.5, color: "var(--pj-faint)" }}>
                      {m.status === "done" ? "Completed" : "Awaiting your approval"}
                    </span>
                    {m.status !== "done" ? (
                      <button
                        onClick={() => {
                          const completedStageId = stageCompletedBy(m.id);
                          approveMilestone(m.id, m.notePrompt ? noteValue : undefined);
                          if (completedStageId) {
                            setJustCompletedStageId(completedStageId);
                            setView("complete");
                            window.scrollTo(0, 0);
                          } else if (!isLast) {
                            setMilestone(milestone + 1);
                          } else {
                            backToJourney();
                          }
                        }}
                        style={{ marginLeft: isFirst ? "auto" : 0, background: "var(--pj-act)", color: "var(--pj-act-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 650, fontSize: 15, border: "none", borderRadius: "var(--pj-radius-pill)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", boxShadow: "0 8px 20px -10px rgba(217,119,87,.5)" }}
                      >
                        {isLast ? "Approve & finish" : "Approve & continue"} <span style={{ fontSize: 17 }}>→</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => (isLast ? backToJourney() : setMilestone(milestone + 1))}
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
