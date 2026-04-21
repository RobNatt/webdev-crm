"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Lead, LeadTouchOutcome, LogTouchPayload, Method, Script, TouchpointRow } from "../../lib/types";
import { getCadenceSuggestion } from "../../lib/cadenceSuggestions";

const OUTCOMES: { value: LeadTouchOutcome; label: string }[] = [
  { value: "no_reply", label: "No reply" },
  { value: "replied", label: "Replied" },
  { value: "booked_call", label: "Booked call" },
  { value: "not_interested", label: "Not interested" }
];

function scriptsForNextTouch(lead: Lead, scripts: Script[]): Script[] {
  return scripts
    .filter((s) => s.active && s.tier === lead.tier)
    .filter((s) => {
      if (lead.nextAction === "none") return false;
      if (lead.nextAction === "follow_up") return s.stage === "follow_up";
      return s.stage === lead.nextAction;
    })
    .sort((a, b) => b.performanceScore - a.performanceScore);
}

type Props = {
  lead: Lead;
  touchpointsNewestFirst: TouchpointRow[];
  scripts: Script[];
  disabled: boolean;
  onSubmit: (payload: LogTouchPayload) => Promise<void>;
};

export function LogTouchSection({ lead, touchpointsNewestFirst, scripts, disabled, onSubmit }: Props) {
  const suggestion = useMemo(
    () => getCadenceSuggestion(lead, touchpointsNewestFirst, scripts),
    [lead, touchpointsNewestFirst, scripts]
  );

  const options = useMemo(() => scriptsForNextTouch(lead, scripts), [lead, scripts]);

  const [method, setMethod] = useState<Method>(suggestion.method);
  const [scriptId, setScriptId] = useState<number | "">(suggestion.script?.id ?? "");
  const [outcome, setOutcome] = useState<LeadTouchOutcome>("no_reply");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const touchIdsKey = touchpointsNewestFirst.map((t) => t.id).join(",");
  const scriptsKey = scripts.map((s) => s.id).join(",");

  useEffect(() => {
    const s = getCadenceSuggestion(lead, touchpointsNewestFirst, scripts);
    const opts = scriptsForNextTouch(lead, scripts);
    setMethod(s.method);
    setScriptId(s.script?.id ?? opts[0]?.id ?? "");
    setOutcome("no_reply");
    setNotes("");
    setError(null);
  }, [lead.id, lead.touchCount, lead.nextAction, lead.tier, touchIdsKey, scriptsKey]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (disabled || submitting) return;
    const sid = typeof scriptId === "number" ? scriptId : options[0]?.id;
    if (!sid) {
      setError("Add an active script for this tier and stage before logging.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        leadId: lead.id,
        type: method,
        outcome,
        notes: notes.trim(),
        scriptId: sid
      });
      setNotes("");
      setOutcome("no_reply");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save touch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="log-touch" className="card" aria-labelledby="log-touch-section-title" style={{ scrollMarginTop: 16 }}>
      <h2 id="log-touch-section-title" style={{ marginTop: 0, fontSize: 17 }}>
        Log this touch
      </h2>
      <p style={{ marginTop: 0, color: "#64748b", fontSize: 14 }}>
        We pick script and channel from your cadence rules — adjust if you actually did something different.
      </p>

      {disabled ? (
        <p style={{ color: "#b45309", fontWeight: 500 }}>This lead is closed for further outreach (dead, opted out, or 3 touches done).</p>
      ) : (
        <form onSubmit={(ev) => void handleSubmit(ev)}>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 14,
              marginBottom: 16
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Suggested next step
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>{suggestion.headline}</div>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "#475569", lineHeight: 1.45 }}>{suggestion.detail}</p>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="log-sec-method" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Contact method
            </label>
            <select
              id="log-sec-method"
              value={method}
              onChange={(ev) => setMethod(ev.target.value as Method)}
              disabled={submitting}
              style={{ width: "100%", maxWidth: 320 }}
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="log-sec-script" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Script (tier {lead.tier})
            </label>
            {options.length === 0 ? (
              <p style={{ color: "#b42318", fontSize: 14 }}>No active script matches this lead&apos;s next action. Add one in Script library.</p>
            ) : (
              <select
                id="log-sec-script"
                value={scriptId === "" ? "" : String(scriptId)}
                onChange={(ev) => setScriptId(ev.target.value ? Number(ev.target.value) : "")}
                disabled={submitting}
                style={{ width: "100%", maxWidth: 420 }}
              >
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · score {s.performanceScore.toFixed(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="log-sec-outcome" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Outcome
            </label>
            <select
              id="log-sec-outcome"
              value={outcome}
              onChange={(ev) => setOutcome(ev.target.value as LeadTouchOutcome)}
              disabled={submitting}
              style={{ width: "100%", maxWidth: 320 }}
            >
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label htmlFor="log-sec-notes" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Notes <span style={{ fontWeight: 400, color: "#64748b" }}>(optional)</span>
            </label>
            <textarea
              id="log-sec-notes"
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              disabled={submitting}
              rows={4}
              placeholder="Who you spoke with, objection, promised follow-up…"
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          {error ? (
            <p role="alert" style={{ color: "#b42318", fontSize: 14 }}>
              {error}
            </p>
          ) : null}

          <div className="row" style={{ marginTop: 8, flexWrap: "wrap", gap: 8 }}>
            <button type="submit" disabled={submitting || options.length === 0}>
              {submitting ? "Saving…" : "Save touch to timeline"}
            </button>
            <button type="button" disabled={submitting} onClick={() => setNotes("")}>
              Clear notes
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
