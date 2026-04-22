"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Lead, LeadTouchOutcome, LogTouchPayload, Method, Script, TouchpointRow } from "../../lib/types";
import { getCadenceSuggestion } from "../../lib/cadenceSuggestions";
import styles from "./LogTouchSection.module.css";

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
    <section id="log-touch" className={`card ${styles.section}`} aria-labelledby="log-touch-section-title">
      <h2 id="log-touch-section-title" className={styles.title}>
        Log this touch
      </h2>
      <p className={styles.intro}>
        We pick script and channel from your cadence rules — adjust if you actually did something different.
      </p>

      {disabled ? (
        <p className={styles.closed}>This lead is closed for further outreach (dead, opted out, or 3 touches done).</p>
      ) : (
        <form onSubmit={(ev) => void handleSubmit(ev)}>
          <div className={styles.callout}>
            <div className={styles.calloutLabel}>Suggested next step</div>
            <div className={styles.headline}>{suggestion.headline}</div>
            <p className={styles.detail}>{suggestion.detail}</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="log-sec-method" className="fieldLabel">
              Contact method
            </label>
            <select
              id="log-sec-method"
              className="select"
              value={method}
              onChange={(ev) => setMethod(ev.target.value as Method)}
              disabled={submitting}
              style={{ maxWidth: 320 }}
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="log-sec-script" className="fieldLabel">
              Script (tier {lead.tier})
            </label>
            {options.length === 0 ? (
              <p className={styles.error}>No active script matches this lead&apos;s next action. Add one in Script library.</p>
            ) : (
              <select
                id="log-sec-script"
                className="select"
                value={scriptId === "" ? "" : String(scriptId)}
                onChange={(ev) => setScriptId(ev.target.value ? Number(ev.target.value) : "")}
                disabled={submitting}
                style={{ maxWidth: 420 }}
              >
                {options.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · score {s.performanceScore.toFixed(1)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="log-sec-outcome" className="fieldLabel">
              Outcome
            </label>
            <select
              id="log-sec-outcome"
              className="select"
              value={outcome}
              onChange={(ev) => setOutcome(ev.target.value as LeadTouchOutcome)}
              disabled={submitting}
              style={{ maxWidth: 320 }}
            >
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="log-sec-notes" className="fieldLabel">
              Notes <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="log-sec-notes"
              className="textarea"
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              disabled={submitting}
              rows={4}
              placeholder="Who you spoke with, objection, promised follow-up…"
            />
          </div>

          {error ? (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button type="submit" className="btn" disabled={submitting || options.length === 0}>
              {submitting ? "Saving…" : "Save touch to timeline"}
            </button>
            <button type="button" className="btnSecondary" disabled={submitting} onClick={() => setNotes("")}>
              Clear notes
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
