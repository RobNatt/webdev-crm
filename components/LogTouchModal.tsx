"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Lead, LeadTouchOutcome, LogTouchPayload, Method, Script } from "../lib/types";

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

  const closed =
    lead.status === "dead" || lead.status === "no_further_follow_up" || lead.touchCount >= 3;

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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-touch-title"
        className="card"
        style={{ maxWidth: 440, width: "100%", margin: 0 }}
        onMouseDown={(ev) => ev.stopPropagation()}
      >
        <h3 id="log-touch-title" style={{ marginTop: 0 }}>
          Log touch — {lead.companyName}
        </h3>
        {closed ? (
          <p style={{ color: "#a33" }}>This lead is closed for further outreach.</p>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="touch-method" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Contact method
              </label>
              <select
                id="touch-method"
                value={method}
                onChange={(ev) => setMethod(ev.target.value as Method)}
                disabled={submitting}
                style={{ width: "100%" }}
              >
                <option value="email">Email</option>
                <option value="call">Call</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="touch-outcome" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Reply / outcome
              </label>
              <select
                id="touch-outcome"
                value={outcome}
                onChange={(ev) => setOutcome(ev.target.value as LeadTouchOutcome)}
                disabled={submitting}
                style={{ width: "100%" }}
              >
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="touch-notes" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
                Notes (optional)
              </label>
              <textarea
                id="touch-notes"
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="What was said, next step, etc."
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
            {scripts.length === 0 ? (
              <p style={{ color: "#a33", fontSize: 14 }}>
                Add at least one active script for this lead&apos;s tier before logging touches.
              </p>
            ) : null}
            {error ? (
              <p role="alert" style={{ color: "#b42318", fontSize: 14 }}>
                {error}
              </p>
            ) : null}
            <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting || closed || scripts.length === 0}>
                {submitting ? "Saving…" : "Save touch"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
