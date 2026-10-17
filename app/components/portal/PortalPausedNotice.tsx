"use client";

import { useEffect } from "react";

// What a client sees when their record is "paused" (journeyState), in place of
// their portal. Written for Fin (Jesse, 2026-10-17): his portal was replaced by
// a custom one, ready Sunday 18 October on the same link. Reword the copy
// before pausing anyone else.

export function PortalPausedNotice({ firstName, brand, portalToken }: { firstName: string; brand: string; portalToken: string }) {
  // Tell admin the client opened their link, as the portal does. Skipped in a
  // browser signed in to admin, so Jesse's own checks don't count.
  useEffect(() => {
    try { if (window.localStorage.getItem("scaleAdminToken")) return; } catch {}
    fetch(`/api/portal/${portalToken}/opened`, { method: "POST", keepalive: true }).catch(() => {});
  }, [portalToken]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
        background: "radial-gradient(120% 80% at 15% 10%, #3b2a6b 0%, transparent 55%), radial-gradient(90% 70% at 90% 90%, #6b2a4f 0%, transparent 60%), #0e0e12",
        color: "#f6f3ee",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, color: "rgba(246,243,238,0.6)" }}>{brand}</div>
        <h1 style={{ fontFamily: "var(--font-heading), system-ui, sans-serif", fontSize: "clamp(32px, 7vw, 44px)", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.02em", margin: "14px 0 0" }}>
          A new version is on its way
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, margin: "22px 0 0" }}>
          Apologies{firstName ? `, ${firstName}` : ""}. This version of your portal is now out of date.
        </p>
        <p style={{ fontSize: 17, lineHeight: 1.6, margin: "14px 0 0" }}>
          Jesse is finishing a new one, tailor-made for your project and everything we&apos;re delivering for you. It&apos;ll be ready by Sunday night, and this same link will open it.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: "22px 0 0", color: "rgba(246,243,238,0.7)" }}>Any questions before then, just message Jesse.</p>
      </div>
    </main>
  );
}
