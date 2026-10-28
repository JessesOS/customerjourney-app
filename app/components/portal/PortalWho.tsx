"use client";

import { useEffect, useState } from "react";
import { readPerson, savePerson } from "@/lib/portalPerson";

/**
 * Who's this? (AT Network first, Jesse 2026-10-28). Several people share one
 * link. The first time a device opens the portal it asks, with one tap, which
 * of them this is, and remembers it on that device. The header's
 * round initial becomes theirs ("Rich  R"); tapping it asks again. Ticks, uploads and messages then carry the
 * name. A name, not a login. Shown only when the product lists journey.people.
 */
export function PortalWho({ portalToken, people }: { portalToken: string; people: string[] }) {
  const [person, setPerson] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const saved = readPerson(portalToken);
    if (people.includes(saved)) setPerson(saved);
    else setAsking(true);
    const onAsk = () => setAsking(true);
    window.addEventListener("pjc:who", onAsk);
    return () => window.removeEventListener("pjc:who", onAsk);
  }, [portalToken, people]);

  function pick(name: string) {
    savePerson(portalToken, name);
    setPerson(name);
    setAsking(false);
  }

  return (
    <>
      {asking && (
        <div className="pjw-veil" role="dialog" aria-modal="true" aria-labelledby="pjw-title">
          <div className="pjw-card">
            <h2 id="pjw-title">Who&apos;s this?</h2>
            <p>Tap your name. We&apos;ll remember it on this device, so the team can see who did what.</p>
            <div className="pjw-people">
              {people.map((p) => (
                <button key={p} type="button" className={p === person ? "is-on" : undefined} onClick={() => pick(p)}>
                  <span aria-hidden>{p.slice(0, 1)}</span>
                  {p}
                </button>
              ))}
            </div>
            {person && (
              <button type="button" className="pjw-cancel" onClick={() => setAsking(false)}>
                Keep {person}
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`
        .pjw-veil { position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(10,14,12,.45); backdrop-filter: blur(6px); }
        .pjw-card { width: 100%; max-width: 420px; background: var(--pj-card, #fff); color: var(--pj-ink); border-radius: 22px; padding: 28px 24px 22px; box-shadow: 0 30px 80px -30px rgba(0,0,0,.6); text-align: center; }
        .pjw-card h2 { font: 800 26px var(--font-heading), sans-serif; letter-spacing: -0.02em; margin: 0 0 8px; }
        .pjw-card p { font-size: 14.5px; line-height: 1.5; color: var(--pj-muted); margin: 0 0 20px; }
        .pjw-people { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pjw-people button { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; border-radius: 16px; border: 1px solid var(--pj-line); background: var(--pj-bg); color: var(--pj-ink); font: 650 16px var(--font-body), sans-serif; cursor: pointer; }
        .pjw-people button:hover, .pjw-people button.is-on { border-color: var(--pj-act); }
        .pjw-people button span { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--pj-act); color: #fff; font: 800 19px var(--font-heading), sans-serif; }
        .pjw-cancel { margin-top: 14px; border: 0; background: none; color: var(--pj-muted); font: 500 13px var(--font-body), sans-serif; cursor: pointer; text-decoration: underline; }
      `}</style>
    </>
  );
}
