"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Lead, LeadTouchOutcome, LogTouchPayload, Method, Script } from "../lib/types";
import styles from "./LogTouchModal.module.css";

type Props = {
  lead: Lead | null;
  scripts: Script[];
  open: boolean;
  onClose: () => void;
  /** Should throw on failure so the modal can show the error. */
  onSubmit: (payload: LogTouchPayload) => Promise<void>;
};

const OUTCOMES: { value: LeadTouchOutcome; label: string }[] = [
  { value: "no_reply", label: "No reply" },
  { value: "replied", label: "Replied" },
  { value: "booked_call", label: "Booked call" },
  { value: "not_interested", label: "Not interested" }
];

export function LogTouchModal({ lead, scripts, open, onClose, onSubmit }: Props) {
  const [method, setMethod] = useState<Method>("email");
  const [outcome, setOutcome] = useState<LeadTouchOutcome>("no_reply");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead || !open) return;
    setMethod(lead.preferredContactMethod);
    setOutcome("no_reply");
    setNotes("");
    setError(null);
    setSubmitting(false);
  }, [lead, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open || !lead) return null;

  const closed = lead.status === "dead" || lead.status === "no_further_follow_up" || lead.touchCount >= 3;

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (closed || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        leadId: lead.id,
        type: method,
        outcome,
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save touch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="presentation"
      className={styles.backdrop}
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !submitting) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="log-touch-title" className={styles.dialog} onMouseDown={(ev) => ev.stopPropagation()}>
        <h3 id="log-touch-title" className={styles.dialogTitle}>
          Log touch — {lead.companyName}
        </h3>
        {closed ? (
          <p className={styles.closedNote}>This lead is closed for further outreach.</p>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className={styles.field}>
              <label htmlFor="touch-method" className="fieldLabel">
                Contact method
              </label>
              <select id="touch-method" className="select" value={method} onChange={(ev) => setMethod(ev.target.value as Method)} disabled={submitting}>
                <option value="email">Email</option>
                <option value="call">Call</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="touch-outcome" className="fieldLabel">
                Reply / outcome
              </label>
              <select id="touch-outcome" className="select" value={outcome} onChange={(ev) => setOutcome(ev.target.value as LeadTouchOutcome)} disabled={submitting}>
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="touch-notes" className="fieldLabel">
                Notes (optional)
              </label>
              <textarea
                id="touch-notes"
                className="textarea"
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="What was said, next step, etc."
              />
            </div>
            {scripts.length === 0 ? <p className={styles.closedNote}>Add at least one active script for this lead&apos;s tier before logging touches.</p> : null}
            {error ? (
              <p role="alert" className={styles.closedNote}>
                {error}
              </p>
            ) : null}
            <div className={styles.actions}>
              <button type="button" className="btnSecondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn" disabled={submitting || closed || scripts.length === 0}>
                {submitting ? "Saving…" : "Save touch"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
