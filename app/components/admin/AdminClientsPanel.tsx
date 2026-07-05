"use client";

import { useEffect, useState } from "react";
import { onboardingFormById, formatFieldValue, type PortalFormResponses } from "@/lib/onboardingForm";

type PortalClient = {
  id: string;
  name: string;
  companyName: string;
  portalToken: string;
  startDate: string;
  currentDay: number;
  completedMilestoneCount: number;
  totalMilestoneCount: number;
};

type ListResponse = { ok: boolean; clients?: PortalClient[]; error?: string };
type CreateResponse = { ok: boolean; id?: string; portalToken?: string; error?: string };
type ClientForm = { formId: string; responses: PortalFormResponses | null; completedAt: string | null };
type MilestoneNote = { milestoneId: string; title: string; note: string };
type EditableContent = { milestoneId: string; title: string; content: string };
type ClientUpload = { milestoneId: string; title: string; fileName: string; uploadedAt: string };
type ClientDetail = { forms: ClientForm[]; milestoneNotes: MilestoneNote[]; editableContent: EditableContent[]; uploads: ClientUpload[] };
type FormsResponse = {
  ok: boolean;
  forms?: ClientForm[];
  milestoneNotes?: MilestoneNote[];
  editableContent?: EditableContent[];
  uploads?: ClientUpload[];
  error?: string;
};

function MilestoneContentEditor({ clientId, milestoneId, title, initialContent, adminToken }: { clientId: string; milestoneId: string; title: string; initialContent: string; adminToken?: string }) {
  const [value, setValue] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/portal-clients/${clientId}/milestone-content/${milestoneId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
        body: JSON.stringify({ content: value }),
      });
      const payload = (await res.json()) as { ok: boolean };
      if (payload.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(252,250,246,0.4)", marginBottom: 8 }}>
        {title} — team content
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="One question or line per row — this is what the client sees."
        rows={5}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #333", background: "#151713", color: "#fcfaf6", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
      />
      <button
        onClick={save}
        disabled={saving}
        style={{ marginTop: 8, padding: "7px 14px", borderRadius: 7, border: "1px solid #444", background: saved ? "#00b8a0" : "#fcfaf6", color: "#111", cursor: saving ? "default" : "pointer", fontSize: 13, fontWeight: 500 }}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save for client"}
      </button>
    </div>
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminClientsPanel() {
  const [adminToken, setAdminToken] = useState<string | undefined>(undefined);
  const authHeaders: HeadersInit = adminToken ? { "x-admin-token": adminToken } : {};
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailByClient, setDetailByClient] = useState<Record<string, ClientDetail | "loading" | "error">>({});

  async function loadClients(token?: string) {
    setLoading(true);
    setError(null);
    const headers: HeadersInit = token ? { "x-admin-token": token } : {};
    try {
      const res = await fetch("/api/admin/portal-clients", { cache: "no-store", headers });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const payload = (await res.json()) as ListResponse;
      if (!payload.ok || !payload.clients) {
        setError(payload.error ?? "Could not load clients.");
        return;
      }
      setForbidden(false);
      setClients(payload.clients);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? undefined;
    setAdminToken(token);
    loadClients(token);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portal-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name, companyName, startDate }),
      });
      const payload = (await res.json()) as CreateResponse;
      if (!payload.ok) {
        setError(payload.error ?? "Could not create client.");
        return;
      }
      setName("");
      setCompanyName("");
      setStartDate(todayIso());
      await loadClients();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, clientName: string) {
    if (!confirm(`Delete ${clientName}'s portal? This removes all their progress and cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/portal-clients/${id}`, { method: "DELETE", headers: authHeaders });
      const payload = (await res.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not delete client.");
        return;
      }
      await loadClients();
    } catch {
      setError("Could not reach the server.");
    }
  }

  async function toggleExpanded(client: PortalClient) {
    if (expandedId === client.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(client.id);
    if (detailByClient[client.id]) return;

    setDetailByClient((prev) => ({ ...prev, [client.id]: "loading" }));
    try {
      const res = await fetch(`/api/admin/portal-clients/${client.id}/forms`, { cache: "no-store", headers: authHeaders });
      const payload = (await res.json()) as FormsResponse;
      setDetailByClient((prev) => ({
        ...prev,
        [client.id]: payload.ok
          ? {
              forms: payload.forms ?? [],
              milestoneNotes: payload.milestoneNotes ?? [],
              editableContent: payload.editableContent ?? [],
              uploads: payload.uploads ?? [],
            }
          : "error",
      }));
    } catch {
      setDetailByClient((prev) => ({ ...prev, [client.id]: "error" }));
    }
  }

  function copyLink(client: PortalClient) {
    const url = `${window.location.origin}/portal/${client.portalToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(client.id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #333",
    minWidth: 160,
    background: "#151713",
    color: "#fcfaf6",
  };

  if (forbidden) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", padding: "48px 32px", fontFamily: "system-ui, sans-serif", color: "#fcfaf6", textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Admin access required</h1>
        <p style={{ color: "rgba(252,250,246,0.6)", lineHeight: 1.6 }}>
          This page needs an admin access token. Add <code style={{ color: "#f5a623" }}>?token=…</code> to the URL, or sign in as an authorized admin.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 32px", fontFamily: "system-ui, sans-serif", color: "#fcfaf6" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Portal Clients</h1>
      <p style={{ color: "rgba(252,250,246,0.6)", marginBottom: 32 }}>Create client portal accounts and copy their unique links.</p>

      <form
        onSubmit={handleCreate}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 40, padding: 20, border: "1px solid #2a2c27", borderRadius: 12, background: "#111310" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "rgba(252,250,246,0.6)" }}>Client name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chris"
            required
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "rgba(252,250,246,0.6)" }}>Company (optional)</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Strategize"
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 12, color: "rgba(252,250,246,0.6)" }}>Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#fcfaf6", color: "#111", fontWeight: 600, cursor: creating ? "default" : "pointer", opacity: creating ? 0.6 : 1 }}
        >
          {creating ? "Creating…" : "Create client"}
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#3a1210", color: "#ff9a90", marginBottom: 20 }}>{error}</div>
      )}

      {loading ? (
        <p>Loading clients…</p>
      ) : clients.length === 0 ? (
        <p style={{ color: "rgba(252,250,246,0.6)" }}>No clients yet — create one above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clients.map((client) => {
            const isExpanded = expandedId === client.id;
            const detail = detailByClient[client.id];

            return (
              <div key={client.id} style={{ border: "1px solid #2a2c27", borderRadius: 10, background: "#111310" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {client.name} {client.companyName && <span style={{ color: "rgba(252,250,246,0.5)", fontWeight: 400 }}>· {client.companyName}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(252,250,246,0.5)", marginTop: 2 }}>
                      Day {client.currentDay} / 30 · {client.completedMilestoneCount} of {client.totalMilestoneCount} milestones done · started {client.startDate.slice(0, 10)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpanded(client)}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #444", background: "transparent", color: "#fcfaf6", cursor: "pointer", fontSize: 13 }}
                  >
                    {isExpanded ? "Hide answers ▴" : "View form answers ▾"}
                  </button>
                  <button
                    onClick={() => copyLink(client)}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #444", background: "#fcfaf6", color: "#111", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                  >
                    {copiedId === client.id ? "Copied!" : "Copy portal link"}
                  </button>
                  <button
                    onClick={() => handleDelete(client.id, client.name)}
                    style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #5a2a26", background: "transparent", color: "#ff6e60", cursor: "pointer", fontSize: 13 }}
                  >
                    Delete
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid #2a2c27", padding: "16px 18px" }}>
                    {detail === "loading" && <p style={{ color: "rgba(252,250,246,0.5)", fontSize: 13 }}>Loading answers…</p>}
                    {detail === "error" && <p style={{ color: "#ff9a90", fontSize: 13 }}>Could not load form answers.</p>}
                    {detail && typeof detail === "object" && detail.editableContent.map((item) => (
                      <MilestoneContentEditor
                        key={item.milestoneId}
                        clientId={client.id}
                        milestoneId={item.milestoneId}
                        title={item.title}
                        initialContent={item.content}
                        adminToken={adminToken}
                      />
                    ))}
                    {detail && typeof detail === "object" && detail.milestoneNotes.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(252,250,246,0.4)", marginBottom: 8 }}>
                          Client notes
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {detail.milestoneNotes.map((n) => (
                            <div key={n.milestoneId} style={{ fontSize: 13 }}>
                              <span style={{ color: "rgba(252,250,246,0.6)" }}>{n.title}:</span> <span style={{ color: "#fcfaf6" }}>{n.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail && typeof detail === "object" && detail.uploads.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(252,250,246,0.4)", marginBottom: 8 }}>
                          Uploaded files
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {detail.uploads.map((u) => (
                            <div key={u.milestoneId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                              <span style={{ color: "rgba(252,250,246,0.6)" }}>{u.title}:</span>
                              <span style={{ color: "#fcfaf6" }}>{u.fileName}</span>
                              <a
                                href={`/api/admin/portal-clients/${client.id}/uploads/${u.milestoneId}${adminToken ? `?token=${encodeURIComponent(adminToken)}` : ""}`}
                                style={{ color: "#00b8a0", textDecoration: "underline", fontSize: 12 }}
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail && typeof detail === "object" &&
                      detail.forms.map((clientForm) => {
                        const form = onboardingFormById(clientForm.formId);
                        if (!form) return null;

                        if (!clientForm.responses) {
                          return (
                            <div key={clientForm.formId} style={{ fontSize: 13, color: "rgba(252,250,246,0.5)" }}>
                              {form.title}: not started yet.
                            </div>
                          );
                        }

                        return (
                          <div key={clientForm.formId}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{form.title}</div>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 99,
                                  background: clientForm.completedAt ? "rgba(0,184,160,0.15)" : "rgba(245,166,35,0.15)",
                                  color: clientForm.completedAt ? "#00b8a0" : "#f5a623",
                                }}
                              >
                                {clientForm.completedAt ? "Submitted" : "In progress"}
                              </span>
                            </div>
                            {form.sections.map((section) => (
                              <div key={section.id} style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(252,250,246,0.4)", marginBottom: 8 }}>
                                  {section.title}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {section.fields.map((field) => (
                                    <div key={field.id} style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, fontSize: 13 }}>
                                      <div style={{ color: "rgba(252,250,246,0.6)" }}>{field.label}</div>
                                      <div style={{ color: "#fcfaf6" }}>{formatFieldValue(field, clientForm.responses![field.id])}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
