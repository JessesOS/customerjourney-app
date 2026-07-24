"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildJourneyStages,
  defaultCompletedMilestoneIds,
  defaultCurrentDay,
  journeyProgressPercent,
  journeyTemplate,
  journeyTotalDays,
  milestoneVisibleFor,
  type ClientType,
  type JourneyMilestone,
} from "@/lib/onboardingJourney";
import { buildRespondJourneyStages, respondJourneyTemplate, respondJourneyTotalDays } from "@/lib/respondJourney";
import { onboardingFormById } from "@/lib/onboardingForm";
import { OnboardingFormStepper } from "@/app/components/portal/OnboardingFormStepper";
import { RailVariant, StageRail } from "@/app/components/portal/StageRail";
import { TaskRow } from "@/app/components/portal/TaskRow";
import { UpNextCard } from "@/app/components/portal/UpNextCard";
import { StageCompleteView } from "@/app/components/portal/StageCompleteView";
import { TaskDisplayStatus } from "@/app/components/portal/StatusChip";

type View = "home" | "stage" | "complete";

export type UploadMeta = { fileName: string; uploadedAt: string };

export type ClientPortalExperienceProps = {
  name?: string;
  clientType?: ClientType;
  currentDay?: number;
  initialCompletedMilestoneIds?: string[];
  initialMilestoneNotes?: Record<string, string>;
  milestoneContent?: Record<string, string>;
  milestoneUploads?: Record<string, UploadMeta>;
  portalToken?: string;
  themeVariant?: "warm" | "cool";
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
  clientType = "meta-google",
  currentDay = defaultCurrentDay,
  initialCompletedMilestoneIds = defaultCompletedMilestoneIds,
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
  const [uploads, setUploads] = useState<Record<string, UploadMeta>>(milestoneUploads);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const isRespond = clientType === "respond";
  const activeJourneyTemplate = isRespond ? respondJourneyTemplate : journeyTemplate;
  const activeJourneyTotalDays = isRespond ? respondJourneyTotalDays : journeyTotalDays;

  const journeyStages = useMemo(
    () => (isRespond ? buildRespondJourneyStages(completedIds, currentDay) : buildJourneyStages(completedIds, currentDay, clientType)),
    [completedIds, currentDay, clientType, isRespond],
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
  const [isDemo, setIsDemo] = useState(false);
  useEffect(() => {
    setIsDemo(window.location.pathname === "/portal/demo");
  }, []);
  // Portal look: warm (organic) / cool (slate workshop). Seeded from the client
  // record; the topbar switcher flips it instantly and persists the choice back
  // to the record so it follows the client across devices. Same link always.
  const [theme, setTheme] = useState<"warm" | "cool">(themeVariant);
  function switchTheme(next: "warm" | "cool") {
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

  const progress = journeyProgressPercent(currentDay, activeJourneyTotalDays);
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
    const stage = activeJourneyTemplate.find((s) => s.milestones.some((mm) => mm.id === milestoneId));
    if (!stage) return null;
    const willAllBeDone = stage.milestones
      .filter((mm) => milestoneVisibleFor(mm, clientType))
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
    <div data-pj-theme={theme === "cool" ? "cool" : undefined} style={{ background: "var(--pj-glow) no-repeat, var(--pj-bg)", color: "var(--pj-ink)", fontFamily: "var(--font-body), system-ui, sans-serif", minHeight: "100vh" }}>
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
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--pj-ink)", flexShrink: 0 }}>{isRespond ? "respond" : "scale"}</span>
          <span style={{ width: 1, height: 18, background: "var(--pj-line)", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--pj-muted)", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Client Portal{name ? ` · ${name}` : ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <span style={{ fontSize: 12.5, color: "var(--pj-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
              Day {currentDay} / {activeJourneyTotalDays} · <b style={{ color: "var(--pj-done)", fontWeight: 650 }}>on track</b>
            </span>
            {/* Look switcher: two swatch dots (warm terracotta / cool steel).
                Swatches are hardcoded — they must show their own colour
                regardless of which theme is active. */}
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {(
                [
                  ["warm", "#c67139", "Warm look"],
                  ["cool", "#38708c", "Cool look"],
                ] as const
              ).map(([value, swatch, label]) => (
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
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    opacity: theme === value ? 1 : 0.45,
                    boxShadow: theme === value ? "0 0 0 2px var(--pj-bg), 0 0 0 3.5px " + swatch : "none",
                    transition: "opacity 160ms ease, box-shadow 160ms ease",
                  }}
                />
              ))}
            </span>
            <div style={{ width: 30, height: 30, borderRadius: 99, background: "var(--pj-act)", color: "var(--pj-act-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {name.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      {/* JOURNEY — home view */}
      {view === "home" && (
        <div
          className="pj-home"
          // Cool always uses the deep-frame treatment (via themed vars); warm
          // follows the review-variant choice.
          style={theme === "cool" || railVariant === "deepframe" ? { background: "var(--pj-frame-deep)", borderColor: "var(--pj-frame-deep-line)" } : undefined}
        >
          <div className="pj-rail-desktop">
            <StageRail stages={journeyStages} overallPercent={progress} onSelectStage={(stageId) => openM(stageId, 1)} variant={railVariant} cool={theme === "cool"} />
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
            <p style={{ color: "var(--pj-muted)", fontSize: 14.5, maxWidth: "56ch", margin: 0 }}>
              {currentStage?.blurb ?? "Everything we need from you is done — sit tight while we build."}
            </p>

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
                  desc={upNext ? upNext.detail : "Nothing needed from you right now — we’ll flag you the moment there’s something to review."}
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
              </>
            )}
          </section>

          {/* Review-only: journey-card treatment toggle. Demo route only —
              real client portals never render this. Warm-look tool, so it
              hides while the cool theme is active. Delete once a winner is
              picked. */}
          {isDemo && theme === "warm" && (
            <div style={{ position: "fixed", bottom: 18, right: 18, zIndex: 50, display: "flex", gap: 4, background: "#fff", border: "1px solid var(--pj-line)", borderRadius: 999, padding: 4, boxShadow: "0 12px 32px -12px rgba(60,46,32,.45)" }}>
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
        </div>
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
                <h3 style={{ fontFamily: "var(--font-heading), sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 10px" }}>{m.title}</h3>
                <p style={{ fontSize: 14.5, color: "var(--pj-muted)", margin: 0, maxWidth: "54ch", lineHeight: 1.55 }}>{m.detail}</p>

                {m.videoUrl && (
                  <button
                    onClick={() => openVideo(m.title, m.videoUrl)}
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

                {m.important && (
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
                ) : m.showPortalLink ? (
                  <PortalLinkCard portalToken={portalToken} />
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
                          placeholder={m.notePlaceholder ?? "Optional — leave blank if it looks good."}
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
                      {m.status === "done"
                        ? "Completed"
                        : m.noteRequired && !noteValue.trim()
                          ? "Fill in the field above to continue"
                          : "Awaiting your approval"}
                    </span>
                    {m.status !== "done" ? (
                      (() => {
                        const noteMissing = Boolean(m.noteRequired) && !noteValue.trim();
                        return (
                      <button
                        disabled={noteMissing}
                        onClick={() => {
                          if (noteMissing) return;
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
                        style={{ marginLeft: isFirst ? "auto" : 0, background: noteMissing ? "var(--pj-act-fill)" : "var(--pj-btn-grad)", color: noteMissing ? "var(--pj-act)" : "var(--pj-act-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 650, fontSize: 15, border: "none", borderRadius: "var(--pj-radius-pill)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 9, cursor: noteMissing ? "default" : "pointer", boxShadow: noteMissing ? "none" : "var(--pj-shadow-btn)" }}
                      >
                        {isLast ? "Approve & finish" : "Approve & continue"} <span style={{ fontSize: 17 }}>→</span>
                      </button>
                        );
                      })()
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
