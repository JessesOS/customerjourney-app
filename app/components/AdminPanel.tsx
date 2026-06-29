"use client";

import { useEffect, useMemo, useState } from "react";

type AdminTask = {
  id: string;
  sourceTitle: string;
  sourceDetail: string;
  phase: string;
  status: string;
  assignee: string;
  portalVisible: boolean;
  portalActionRequired: boolean;
  effective: {
    visible: boolean;
    owner: "auto" | "chris" | "jesse";
    title: string;
    detail: string;
    pinnedRank: number | null;
    blocker: boolean;
  };
};

type OverrideDraft = {
  taskId: string;
  visible?: boolean;
  owner?: "chris" | "jesse";
  title?: string;
  detail?: string;
  pinnedRank?: number;
  blocker?: boolean;
};

type AdminResponse = {
  ok?: boolean;
  syncedAt?: string;
  tasks?: AdminTask[];
  overrides?: OverrideDraft[];
};

type Props = {
  onSaved?: () => Promise<void> | void;
};

export function AdminPanel({ onSaved }: Props) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OverrideDraft>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/live-dashboard-admin", { cache: "no-store" });
      if (!response.ok) {
        setIsAvailable(false);
        return;
      }

      const payload = (await response.json()) as AdminResponse;
      if (!payload.ok || !payload.tasks) return;

      setIsAvailable(true);
      setTasks(payload.tasks);
      const nextDrafts: Record<string, OverrideDraft> = {};
      for (const task of payload.tasks) {
        nextDrafts[task.id] = {
          taskId: task.id,
          visible: task.effective.visible,
          owner:
            task.effective.owner === "auto" ? undefined : task.effective.owner,
          title: task.effective.title,
          detail: task.effective.detail,
          pinnedRank: task.effective.pinnedRank ?? undefined,
          blocker: task.effective.blocker,
        };
      }
      setDrafts(nextDrafts);
    }

    void load();
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, AdminTask[]>();
    for (const task of tasks) {
      const list = groups.get(task.phase) ?? [];
      list.push(task);
      groups.set(task.phase, list);
    }
    return [...groups.entries()];
  }, [tasks]);

  function updateDraft(taskId: string, patch: Partial<OverrideDraft>) {
    setDrafts((current) => ({
      ...current,
      [taskId]: {
        ...current[taskId],
        taskId,
        ...patch,
      },
    }));
  }

  async function save() {
    setIsSaving(true);
    try {
      const overrides = Object.values(drafts).map((draft) => ({
        ...draft,
        title: draft.title?.trim() || undefined,
        detail: draft.detail?.trim() || undefined,
      }));

      const response = await fetch("/api/live-dashboard-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ overrides }),
      });

      if (!response.ok) return;
      if (onSaved) await onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  if (!isAvailable) return null;

  return (
    <>
      <button
        className="nav-pill nav-pill-button nav-pill-admin"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Jesse Admin
      </button>

      {isOpen ? (
        <aside className="admin-panel-shell">
          <div className="admin-panel-backdrop" onClick={() => setIsOpen(false)} />
          <div className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <p>Private curation mode</p>
                <h3>Jesse-only task overrides</h3>
              </div>
              <div className="admin-panel-actions">
                <button className="admin-close" onClick={() => setIsOpen(false)} type="button">
                  Close
                </button>
                <button className="button-primary admin-save" disabled={isSaving} onClick={() => void save()} type="button">
                  {isSaving ? "Saving..." : "Save overrides"}
                </button>
              </div>
            </div>

            <div className="admin-panel-body">
              {grouped.map(([phase, phaseTasks]) => (
                <section className="admin-phase" key={phase}>
                  <div className="admin-phase-head">
                    <h4>{phase}</h4>
                    <span>{phaseTasks.length} tasks</span>
                  </div>

                  <div className="admin-task-list">
                    {phaseTasks.map((task) => {
                      const draft = drafts[task.id];
                      if (!draft) return null;

                      return (
                        <article className="admin-task-card" key={task.id}>
                          <div className="admin-task-meta">
                            <strong>{task.sourceTitle}</strong>
                            <span>
                              {task.status} · {task.assignee}
                            </span>
                          </div>

                          <div className="admin-toggle-row">
                            <label>
                              <input
                                checked={draft.visible ?? true}
                                onChange={(event) =>
                                  updateDraft(task.id, { visible: event.target.checked })
                                }
                                type="checkbox"
                              />
                              Visible to client dashboard
                            </label>

                            <label>
                              Owner
                              <select
                                onChange={(event) =>
                                  updateDraft(task.id, {
                                    owner:
                                      event.target.value === "auto"
                                        ? undefined
                                        : (event.target.value as "chris" | "jesse"),
                                  })
                                }
                                value={draft.owner ?? "auto"}
                              >
                                <option value="auto">Auto</option>
                                <option value="chris">Client</option>
                                <option value="jesse">RT Digital</option>
                              </select>
                            </label>

                            <label>
                              Pin
                              <input
                                min={1}
                                onChange={(event) =>
                                  updateDraft(task.id, {
                                    pinnedRank: event.target.value
                                      ? Number(event.target.value)
                                      : undefined,
                                  })
                                }
                                type="number"
                                value={draft.pinnedRank ?? ""}
                              />
                            </label>

                            <label>
                              <input
                                checked={draft.blocker ?? false}
                                onChange={(event) =>
                                  updateDraft(task.id, { blocker: event.target.checked })
                                }
                                type="checkbox"
                              />
                              Force blocker
                            </label>
                          </div>

                          <label className="admin-field">
                            Client title
                            <input
                              onChange={(event) =>
                                updateDraft(task.id, { title: event.target.value })
                              }
                              type="text"
                              value={draft.title ?? ""}
                            />
                          </label>

                          <label className="admin-field">
                            Client detail
                            <textarea
                              onChange={(event) =>
                                updateDraft(task.id, { detail: event.target.value })
                              }
                              rows={3}
                              value={draft.detail ?? ""}
                            />
                          </label>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
