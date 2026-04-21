"use client";

import type { TouchpointRow } from "../../lib/types";
import { formatTouchOutcomeLabel } from "../../lib/leadStatusLabels";

type Props = {
  touchpoints: TouchpointRow[];
};

function methodLabel(type: string) {
  return type === "call" ? "Call" : "Email";
}

export function TouchpointTimeline({ touchpoints }: Props) {
  const chronological = [...touchpoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section className="card" aria-labelledby="timeline-heading" style={{ marginBottom: 16 }}>
      <h2 id="timeline-heading" style={{ marginTop: 0, fontSize: 17 }}>
        Touchpoint timeline
      </h2>
      <p style={{ marginTop: 0, color: "#64748b", fontSize: 14 }}>
        Every outreach attempt in order — date, channel, outcome, and your notes.
      </p>
      {chronological.length === 0 ? (
        <p style={{ color: "#64748b" }}>No touches logged yet. Use “Log this touch” in the section below to start the cadence.</p>
      ) : (
        <div style={{ borderLeft: "2px solid #e2e8f0", marginLeft: 10, paddingLeft: 22 }}>
          {chronological.map((t, index) => (
            <div key={t.id} style={{ position: "relative", paddingBottom: index < chronological.length - 1 ? 22 : 0 }}>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: -29,
                  top: 4,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#2563eb",
                  border: "2px solid #fff",
                  boxShadow: "0 0 0 1px #e2e8f0"
                }}
              />
              <div style={{ fontSize: 13, color: "#64748b" }}>{new Date(t.date).toLocaleString()}</div>
              <div className="row" style={{ flexWrap: "wrap", gap: 8, marginTop: 6, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: t.type === "call" ? "#fef3c7" : "#e0f2fe",
                    color: "#0f172a"
                  }}
                >
                  {methodLabel(t.type)}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{formatTouchOutcomeLabel(t.outcome)}</span>
                {t.scriptName ? (
                  <span style={{ fontSize: 12, color: "#64748b" }}>Script: {t.scriptName}</span>
                ) : null}
              </div>
              {t.notes ? (
                <p style={{ margin: "8px 0 0", fontSize: 14, whiteSpace: "pre-wrap", color: "#334155" }}>{t.notes}</p>
              ) : (
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No notes on this touch.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
