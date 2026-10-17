"use client";

import { useCallback, useEffect, useState } from "react";
import { teamFetch, timeAgo, useMe } from "@/app/components/admin/teamClient";

type Member = { id: number; email: string; name: string; roles: string[]; isAdmin: boolean; active: boolean; lastSeenAt: string | null };
type Draft = { email: string; name: string; roles: string[]; isAdmin: boolean; active: boolean };

const EMPTY: Draft = { email: "", name: "", roles: [], isAdmin: false, active: true };

/** Who can sign in, and the roles they cover (admins edit). */
export function TeamMembers() {
  const { me } = useMe();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { status, data } = await teamFetch<{ members: Member[]; roles: string[] }>("/api/admin/team/members");
    if (status === 200 && data.ok) { setMembers(data.members); setRoles(data.roles); }
    else setError(data.error ?? "Could not load the team.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save(next: Draft) {
    setSaving(true);
    setError(null);
    const { status, data } = await teamFetch("/api/admin/team/members", { method: "POST", json: next });
    setSaving(false);
    if (status === 200 && data.ok) { setDraft(EMPTY); setEditing(null); await load(); }
    else setError(data.error ?? "Could not save.");
  }

  const isAdmin = Boolean(me?.isAdmin);

  return (
    <main className="tb-main" style={{ maxWidth: 980 }}>
      <h1 className="tb-h1">Team</h1>
      <p className="tb-sub">
        Who can sign in, and which roles they cover. Signing in also needs their email on the Cloudflare Access list (two lists, on purpose: Access lets them through the door, this list says who they are here).
      </p>
      {error ? <p className="tb-error">{error}</p> : null}

      <div style={{ display: "grid", gap: 8 }}>
        {members?.length === 0 ? <div className="tb-card tb-empty">No one yet. Add the team below.</div> : null}
        {members?.map((m) => (
          <div key={m.id} className="tb-card" style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr auto auto", gap: 14, alignItems: "center", padding: "12px 14px", opacity: m.active ? 1 : 0.55 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.name}{m.isAdmin ? <span className="tb-chip tb-chip--teal" style={{ marginLeft: 8 }}>Admin</span> : null}{!m.active ? <span className="tb-chip" style={{ marginLeft: 8 }}>Inactive</span> : null}</div>
              <div className="tb-faint" style={{ fontSize: 12.5 }}>{m.email}</div>
            </div>
            <div className="tb-flags">{m.roles.length ? m.roles.map((r) => <span key={r} className="tb-chip">{r}</span>) : <span className="tb-faint" style={{ fontSize: 12.5 }}>No roles</span>}</div>
            <div className="tb-faint" style={{ fontSize: 12.5 }}>Seen {timeAgo(m.lastSeenAt)}</div>
            {isAdmin ? <button type="button" className="tb-btn tb-btn--small" onClick={() => { setEditing(m.email); setDraft({ email: m.email, name: m.name, roles: m.roles, isAdmin: m.isAdmin, active: m.active }); }}>Edit</button> : <span />}
          </div>
        ))}
      </div>

      {isAdmin ? (
        <form
          className="tb-card"
          style={{ padding: 16, marginTop: 20 }}
          onSubmit={(e) => { e.preventDefault(); void save(draft); }}
        >
          <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>{editing ? `Edit ${editing}` : "Add someone"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label className="tb-label" htmlFor="tm-name">Name</label><input id="tm-name" className="tb-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><label className="tb-label" htmlFor="tm-email">Sign-in email</label><input id="tm-email" className="tb-input" type="email" value={draft.email} disabled={Boolean(editing)} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
          </div>
          <div className="tb-label" style={{ marginTop: 14 }}>Roles they cover</div>
          <div className="tb-flags">
            {roles.map((r) => {
              const on = draft.roles.includes(r);
              return (
                <button key={r} type="button" className={on ? "tb-chip tb-chip--teal" : "tb-chip"} style={{ border: 0, cursor: "pointer" }} aria-pressed={on} onClick={() => setDraft({ ...draft, roles: on ? draft.roles.filter((x) => x !== r) : [...draft.roles, r] })}>
                  {on ? "✓ " : ""}{r}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 18, margin: "14px 0", fontSize: 13 }}>
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={draft.isAdmin} onChange={(e) => setDraft({ ...draft, isAdmin: e.target.checked })} /> Admin (can manage the team)</label>
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} /> Active</label>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="tb-btn tb-btn--primary" disabled={saving || !draft.name.trim() || !draft.email.trim()}>{editing ? "Save" : "Add"}</button>
            {editing ? <button type="button" className="tb-btn" onClick={() => { setEditing(null); setDraft(EMPTY); }}>Cancel</button> : null}
          </div>
        </form>
      ) : null}
    </main>
  );
}
