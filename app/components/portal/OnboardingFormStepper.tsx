"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortalFormDefinition, PortalFormField, PortalFormResponses } from "@/lib/onboardingForm";
import { emptyFormResponses } from "@/lib/onboardingForm";

type FlatField = { field: PortalFormField; sectionTitle: string };

function flattenFields(form: PortalFormDefinition): FlatField[] {
  return form.sections.flatMap((section) => section.fields.map((field) => ({ field, sectionTitle: section.title })));
}

function isAnswered(field: PortalFormField, value: PortalFormResponses[string] | undefined) {
  if (!field.required) return true;
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: 12,
  border: "1px solid var(--pj-line)",
  background: "#faf7f2",
  color: "var(--pj-ink)",
  fontFamily: "var(--font-body), system-ui, sans-serif",
  fontSize: 15,
  outline: "none",
};

export function OnboardingFormStepper({
  form,
  portalToken,
  onComplete,
}: {
  form: PortalFormDefinition;
  portalToken?: string;
  onComplete: () => void;
}) {
  const flat = useMemo(() => flattenFields(form), [form]);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<PortalFormResponses>(() => emptyFormResponses(form));
  const [loading, setLoading] = useState(Boolean(portalToken));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (!portalToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/portal/${portalToken}/form/${form.id}`)
      .then((res) => res.json())
      .then((payload: { ok: boolean; responses?: PortalFormResponses; completedAt?: string | null }) => {
        if (cancelled || !payload.ok) return;
        if (payload.responses) setResponses((prev) => ({ ...prev, ...payload.responses }));
        if (payload.completedAt) setAlreadySubmitted(true);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [portalToken, form.id]);

  function persist(nextResponses: PortalFormResponses, submit: boolean) {
    if (!portalToken) return Promise.resolve(true);
    return fetch(`/api/portal/${portalToken}/form/${form.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses: nextResponses, submit }),
    })
      .then((res) => res.json())
      .then((payload: { ok: boolean; error?: string }) => {
        if (!payload.ok) {
          setError(payload.error ?? "Could not save your answers.");
          return false;
        }
        return true;
      })
      .catch(() => {
        setError("Could not reach the server.");
        return false;
      });
  }

  if (loading) {
    return <div style={{ padding: 22, color: "var(--pj-muted)", fontSize: 14 }}>Loading your form…</div>;
  }

  if (alreadySubmitted) {
    return (
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, borderRadius: 14, border: "1px solid var(--pj-done)", background: "var(--pj-done-fill)", padding: "16px 18px" }}>
        <div style={{ width: 24, height: 24, borderRadius: 99, background: "var(--pj-done)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: 13 }}>✓</div>
        <div style={{ flex: 1, fontSize: 14, color: "var(--pj-ink)" }}>Your onboarding form has been submitted. Thank you!</div>
      </div>
    );
  }

  const current = flat[index];
  const total = flat.length;
  const isLast = index === total - 1;
  const isFirst = index === 0;
  const value = responses[current.field.id];
  const answered = isAnswered(current.field, value);

  function updateValue(fieldId: string, next: PortalFormResponses[string]) {
    setError(null);
    setResponses((prev) => ({ ...prev, [fieldId]: next }));
  }

  async function goNext() {
    if (!answered) return;
    setSubmitting(true);
    const submit = isLast;
    const ok = await persist(responses, submit);
    setSubmitting(false);
    if (!ok) return;
    if (submit) {
      onComplete();
      return;
    }
    setIndex((i) => Math.min(total - 1, i + 1));
  }

  function goBack() {
    setError(null);
    setIndex((i) => Math.max(0, i - 1));
  }

  return (
    <div style={{ marginTop: 24, borderRadius: 18, border: "1px solid var(--pj-line)", background: "var(--pj-card)", padding: 24, animation: "viewIn 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--pj-act)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {current.sectionTitle}
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--pj-faint)" }}>
          {index + 1} / {total}
        </div>
      </div>

      <div style={{ height: 3, borderRadius: 99, background: "#e7dccb", marginBottom: 24, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((index + 1) / total) * 100}%`, background: "var(--pj-act)", borderRadius: 99, transition: "width 0.3s ease" }} />
      </div>

      <FieldPrompt field={current.field} value={value} onChange={(next) => updateValue(current.field.id, next)} onEnter={goNext} />

      {error && <div style={{ marginTop: 14, fontSize: 13, color: "#b23b2e" }}>{error}</div>}

      <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 14 }}>
        {!isFirst && (
          <button
            onClick={goBack}
            style={{ background: "transparent", border: "1px solid var(--pj-line)", color: "var(--pj-muted)", fontFamily: "var(--font-body), sans-serif", fontWeight: 550, fontSize: 14, borderRadius: 12, padding: "12px 18px", cursor: "pointer" }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={goNext}
          disabled={!answered || submitting}
          style={{
            marginLeft: isFirst ? 0 : "auto",
            background: !answered || submitting ? "var(--pj-act-fill)" : "var(--pj-act)",
            color: !answered || submitting ? "var(--pj-act)" : "var(--pj-act-ink)",
            fontFamily: "var(--font-body), sans-serif",
            fontWeight: 650,
            fontSize: 15,
            border: "none",
            borderRadius: 999,
            padding: "13px 24px",
            display: "flex",
            alignItems: "center",
            gap: 9,
            cursor: !answered || submitting ? "default" : "pointer",
          }}
        >
          {submitting ? "Saving…" : isLast ? "Submit" : "Next"} {!submitting && <span style={{ fontSize: 17 }}>→</span>}
        </button>
      </div>
    </div>
  );
}

function FieldPrompt({
  field,
  value,
  onChange,
  onEnter,
}: {
  field: PortalFormField;
  value: PortalFormResponses[string] | undefined;
  onChange: (next: PortalFormResponses[string]) => void;
  onEnter: () => void;
}) {
  const textValue = typeof value === "string" ? value : "";
  const arrayValue = Array.isArray(value) ? value : [];

  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 22, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.3, color: "var(--pj-ink)" }}>
        {field.label} {field.required && <span style={{ color: "var(--pj-act)" }}>*</span>}
      </h3>
      {field.helper && <p style={{ fontSize: 13, color: "var(--pj-muted)", marginTop: 8, lineHeight: 1.5 }}>{field.helper}</p>}

      {(field.inviteEmails || field.steps || field.guideUrl) && (
        <div style={{ marginTop: 16, borderRadius: 14, border: "1px solid var(--pj-line)", background: "#faf7f2", padding: 20 }}>
          {field.inviteEmails && field.inviteEmails.length > 0 && (
            <div>
              <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 10 }}>
                Invite these two emails as Managers
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {field.inviteEmails.map((email) => (
                  <CopyEmail key={email} email={email} />
                ))}
              </div>
            </div>
          )}

          {field.steps && field.steps.length > 0 && (
            <div style={{ marginTop: field.inviteEmails ? 18 : 0 }}>
              <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 650, color: "var(--pj-faint)", marginBottom: 10 }}>
                How to do it
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 7 }}>
                {field.steps.map((s, i) => (
                  <li key={i} style={{ fontSize: 13.5, color: "var(--pj-ink)", lineHeight: 1.5 }}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {field.guideUrl && (
            <a
              href={field.guideUrl}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 9, background: "var(--pj-card)", border: "1px solid var(--pj-ink)", borderRadius: 999, padding: "9px 18px", color: "var(--pj-ink)", fontFamily: "var(--font-body), sans-serif", fontWeight: 600, fontSize: 13.5, textDecoration: "none" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {field.guideLabel ?? "Watch the guide"}
            </a>
          )}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {(field.type === "text" || field.type === "email" || field.type === "url" || field.type === "tel") && (
          <input
            type={field.type}
            value={textValue}
            placeholder={field.placeholder}
            autoFocus
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onEnter()}
            style={inputStyle}
          />
        )}

        {field.type === "textarea" && (
          <textarea
            value={textValue}
            placeholder={field.placeholder}
            autoFocus
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-body), system-ui, sans-serif" }}
          />
        )}

        {field.type === "select" && (
          <select value={textValue} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="" disabled>
              Select an option…
            </option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type === "radio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {field.options?.map((opt) => {
              const active = textValue === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: active ? "1.5px solid var(--pj-act)" : "1px solid var(--pj-line)",
                    background: active ? "var(--pj-act-fill)" : "transparent",
                    color: "var(--pj-ink)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body), sans-serif",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                  {opt.description && <div style={{ fontSize: 12.5, color: "var(--pj-muted)", marginTop: 3 }}>{opt.description}</div>}
                </button>
              );
            })}
          </div>
        )}

        {field.type === "checkboxes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {field.options?.map((opt) => {
              const active = arrayValue.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange(active ? arrayValue.filter((v) => v !== opt.value) : [...arrayValue, opt.value])}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: active ? "1.5px solid var(--pj-done)" : "1px solid var(--pj-line)",
                    background: active ? "var(--pj-done-fill)" : "transparent",
                    color: "var(--pj-ink)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body), sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: active ? "none" : "1px solid var(--pj-line)", background: active ? "var(--pj-done)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>
                    {active ? "✓" : ""}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {field.type === "checkbox" && (
          <button
            onClick={() => onChange(value === "accepted" ? "" : "accepted")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              padding: "14px 16px",
              borderRadius: 12,
              border: value === "accepted" ? "1.5px solid var(--pj-done)" : "1px solid var(--pj-line)",
              background: value === "accepted" ? "var(--pj-done-fill)" : "transparent",
              color: "var(--pj-ink)",
              cursor: "pointer",
              fontFamily: "var(--font-body), sans-serif",
              fontSize: 14,
              fontWeight: 500,
              width: "100%",
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: 6, border: value === "accepted" ? "none" : "1px solid var(--pj-line)", background: value === "accepted" ? "var(--pj-done)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>
              {value === "accepted" ? "✓" : ""}
            </span>
            I accept
          </button>
        )}
      </div>
    </div>
  );
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(email)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {});
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        background: "var(--pj-card)",
        border: "1px solid var(--pj-line)",
        borderRadius: 10,
        padding: "11px 14px",
        cursor: "pointer",
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <span style={{ flex: 1, fontSize: 14, fontWeight: 550, color: "var(--pj-ink)", wordBreak: "break-all" }}>{email}</span>
      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: copied ? "var(--pj-done)" : "var(--pj-muted)" }}>
        {copied ? "Copied ✓" : "Copy"}
      </span>
    </button>
  );
}
