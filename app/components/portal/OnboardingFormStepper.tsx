"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortalFormDefinition, PortalFormField, PortalFormResponses } from "@/lib/onboardingForm";
import { emptyFormResponses } from "@/lib/onboardingForm";

const teal = "#00b8a0";
const gold = "#f5a623";
const text = "#eef1f6";

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
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.03)",
  color: text,
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
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
    return <div style={{ padding: 22, color: "rgba(238,241,246,0.5)", fontSize: 14 }}>Loading your form…</div>;
  }

  if (alreadySubmitted) {
    return (
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12, borderRadius: 14, border: "1px solid rgba(0,184,160,0.35)", background: "rgba(0,184,160,0.07)", padding: "16px 18px" }}>
        <div style={{ width: 24, height: 24, borderRadius: 99, background: teal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#04130e", fontSize: 13 }}>✓</div>
        <div style={{ flex: 1, fontSize: 14, color: text }}>Your onboarding form has been submitted. Thank you!</div>
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
    <div style={{ marginTop: 24, borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: 24, animation: "viewIn 0.25s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: gold, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {current.sectionTitle}
        </div>
        <div style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "rgba(238,241,246,0.4)" }}>
          {index + 1} / {total}
        </div>
      </div>

      <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.08)", marginBottom: 24, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${((index + 1) / total) * 100}%`, background: gold, borderRadius: 99, transition: "width 0.3s ease" }} />
      </div>

      <FieldPrompt field={current.field} value={value} onChange={(next) => updateValue(current.field.id, next)} onEnter={goNext} />

      {error && <div style={{ marginTop: 14, fontSize: 13, color: "#ff9a90" }}>{error}</div>}

      <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 14 }}>
        {!isFirst && (
          <button
            onClick={goBack}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(238,241,246,0.7)", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 500, fontSize: 14, borderRadius: 12, padding: "12px 18px", cursor: "pointer" }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={goNext}
          disabled={!answered || submitting}
          style={{
            marginLeft: isFirst ? 0 : "auto",
            background: !answered || submitting ? "rgba(245,166,35,0.35)" : gold,
            color: "#1c1300",
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontWeight: 600,
            fontSize: 15,
            border: "none",
            borderRadius: 12,
            padding: "13px 22px",
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
      <h3 style={{ fontWeight: 700, fontSize: 22, margin: 0, letterSpacing: "-0.015em", lineHeight: 1.3 }}>
        {field.label} {field.required && <span style={{ color: gold }}>*</span>}
      </h3>
      {field.helper && <p style={{ fontSize: 13, color: "rgba(238,241,246,0.5)", marginTop: 8, lineHeight: 1.5 }}>{field.helper}</p>}

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
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
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
                    border: active ? `1.5px solid ${gold}` : "1px solid rgba(255,255,255,0.12)",
                    background: active ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.02)",
                    color: text,
                    cursor: "pointer",
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</div>
                  {opt.description && <div style={{ fontSize: 12.5, color: "rgba(238,241,246,0.55)", marginTop: 3 }}>{opt.description}</div>}
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
                    border: active ? `1.5px solid ${teal}` : "1px solid rgba(255,255,255,0.12)",
                    background: active ? "rgba(0,184,160,0.08)" : "rgba(255,255,255,0.02)",
                    color: text,
                    cursor: "pointer",
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 5, border: active ? "none" : "1px solid rgba(255,255,255,0.3)", background: active ? teal : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#04130e" }}>
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
              border: value === "accepted" ? `1.5px solid ${teal}` : "1px solid rgba(255,255,255,0.12)",
              background: value === "accepted" ? "rgba(0,184,160,0.08)" : "rgba(255,255,255,0.02)",
              color: text,
              cursor: "pointer",
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: 14,
              fontWeight: 500,
              width: "100%",
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: 6, border: value === "accepted" ? "none" : "1px solid rgba(255,255,255,0.3)", background: value === "accepted" ? teal : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#04130e" }}>
              {value === "accepted" ? "✓" : ""}
            </span>
            I accept
          </button>
        )}
      </div>
    </div>
  );
}
