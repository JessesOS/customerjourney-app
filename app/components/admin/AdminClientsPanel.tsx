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
type FormsResponse = { ok: boolean; forms?: ClientForm[]; error?: string };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AdminClientsPanel() {
  const [clients, setClients] = useState<PortalClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formsByClient, setFormsByClient] = useState<Record<string, ClientForm[] | "loading" | "error">>({});

  async function loadClients() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portal-clients", { cache: "no-store" });
      const payload = (await res.json()) as ListResponse;
      if (!payload.ok || !payload.clients) {
        setError(payload.error ?? "Could not load clients.");
        return;
      }
      setClients(payload.clients);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/portal-clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`/api/admin/portal-clients/${id}`, { method: "DELETE" });
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
    if (formsByClient[client.id]) return;

    setFormsByClient((prev) => ({ ...prev, [client.id]: "loading" }));
    try {
      const res = await fetch(`/api/admin/portal-clients/${client.id}/forms`, { cache: "no-store" });
      const payload = (await res.json()) as FormsResponse;
      setFormsByClient((prev) => ({ ...prev, [client.id]: payload.ok && payload.forms ? payload.forms : "error" }));
    } catch {
      setFormsByClient((prev) => ({ ...prev, [client.id]: "error" }));
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
            const forms = formsByClient[client.id];

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
                    {forms === "loading" && <p style={{ color: "rgba(252,250,246,0.5)", fontSize: 13 }}>Loading answers…</p>}
                    {forms === "error" && <p style={{ color: "#ff9a90", fontSize: 13 }}>Could not load form answers.</p>}
                    {Array.isArray(forms) &&
                      forms.map((clientForm) => {
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
