"use client";

import { useMemo, useState } from "react";
import type { ChecklistItem, ChecklistOwner, ProjectStage } from "@/lib/collaboration";

type CollaborationHubProps = {
  stages: ProjectStage[];
  initialItems: ChecklistItem[];
};

function ownerLabel(owner: ChecklistOwner) {
  return owner === "chris" ? "Chris action items" : "Jesse action items";
}

export function CollaborationHub({
  stages,
  initialItems,
}: CollaborationHubProps) {
  const [items, setItems] = useState(initialItems);

  const grouped = useMemo(
    () => ({
      chris: items.filter((item) => item.owner === "chris"),
      jesse: items.filter((item) => item.owner === "jesse"),
    }),
    [items]
  );

  function toggleItem(item: ChecklistItem) {
    const completed = !item.completed;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, completed } : entry
      )
    );
  }

  return (
    <section className="collaboration-hub" id="working-plan">
      <div className="section-title collaboration-title">
        <div>
          <p>Working Plan</p>
          <h2>What happens next, and who owns what.</h2>
        </div>
        <span className="sync-pill sync-local">Working draft checklist</span>
      </div>

      <div className="stage-rail" aria-label="Scale client stages">
        {stages.map((stage, index) => (
          <article className={`stage-card stage-${stage.status}`} key={stage.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{stage.label}</h3>
            <p>{stage.detail}</p>
          </article>
        ))}
      </div>

      <div className="task-columns">
        {(["chris", "jesse"] as ChecklistOwner[]).map((owner) => (
          <article className="task-column" key={owner}>
            <div className="task-column-header">
              <h3>{ownerLabel(owner)}</h3>
              <span>
                {grouped[owner].filter((item) => item.completed).length}/
                {grouped[owner].length} complete
              </span>
            </div>
            <div className="task-list">
              {grouped[owner].map((item) => (
                <label
                  className={`task-check ${item.completed ? "is-complete" : ""}`}
                  key={item.id}
                >
                  <input
                    checked={item.completed}
                    onChange={() => toggleItem(item)}
                    type="checkbox"
                  />
                  <span className="checkmark" aria-hidden="true" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
