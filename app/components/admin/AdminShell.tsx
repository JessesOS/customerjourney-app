"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_TOKEN_KEY, useMe } from "@/app/components/admin/teamClient";

const TABS = [
  { href: "/admin/board", label: "Board" },
  { href: "/admin/my-tasks", label: "My tasks" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/team", label: "Team" },
];

/** The back-office menu, sign-in state and lock screen. Invisible while the team board is off. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { me, state, reload } = useMe();
  const onClientsPage = pathname.startsWith("/admin/clients") && !pathname.endsWith("/board");

  // Board off (prod today): the Clients page exactly as it was.
  if (state === "loading" && onClientsPage) return <>{children}</>;
  if (state === "off") {
    if (onClientsPage) return <>{children}</>;
    return (
      <div className="tb">
        <main className="tb-main"><div className="tb-card tb-empty">The team board isn&apos;t switched on here. <a href="/admin/clients">Go to Clients</a>.</div></main>
      </div>
    );
  }
  if (state === "loading") return <div className="tb" />;
  // Not signed in: the Clients page has its own code screen; team pages use this one.
  if (state === "locked") return onClientsPage ? <>{children}</> : <div className="tb"><Lock onDone={reload} /></div>;

  const active = TABS.find((t) => pathname === t.href || (t.href === "/admin/clients" && pathname.startsWith("/admin/clients/")))?.href;
  return (
    <div className="tb">
      <nav className="tb-nav" aria-label="Back office">
        <span className="tb-brand">Team</span>
        {TABS.map((t) => (
          <a key={t.href} href={t.href} className="tb-tab" aria-current={active === t.href ? "page" : undefined}>
            {t.label}
          </a>
        ))}
        <span className="tb-who">
          {me?.name} · {me?.via === "access" ? me.email : me?.via === "code" ? "access code" : "local dev"}
        </span>
      </nav>
      {children}
    </div>
  );
}

function Lock({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  return (
    <form
      className="tb-card tb-lock"
      onSubmit={(e) => {
        e.preventDefault();
        try { window.localStorage.setItem(ADMIN_TOKEN_KEY, code.trim()); } catch {}
        onDone();
      }}
    >
      <h1 className="tb-h1">Team back office</h1>
      <p className="tb-sub">Sign in through your team login, or enter the access code.</p>
      <label className="tb-label" htmlFor="tb-code">Access code</label>
      <input id="tb-code" className="tb-input" type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
      <div style={{ marginTop: 14 }}>
        <button type="submit" className="tb-btn tb-btn--primary" disabled={!code.trim()}>Unlock</button>
      </div>
    </form>
  );
}
