"use client";

import type { Lead, TouchpointRow } from "../../lib/types";
import { formatLeadRowStatus, formatTouchOutcomeLabel } from "../../lib/leadStatusLabels";

type Props = {
  lead: Lead;
  touchpointsNewestFirst: TouchpointRow[];
};

export function LeadDetailSummary({ lead, touchpointsNewestFirst }: Props) {
  const latestOutcome = touchpointsNewestFirst[0]?.outcome;

  return (
    <section className="card" aria-labelledby="lead-summary-heading" style={{ marginBottom: 16 }}>
      <h2 id="lead-summary-heading" style={{ marginTop: 0, fontSize: 15, color: "#475569", fontWeight: 600 }}>
        At a glance
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          alignItems: "start"
        }}
      >
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8" }}>Company</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginTop: 2 }}>{lead.companyName}</div>
          {lead.location ? <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{lead.location}</div> : null}
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8" }}>Tier</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{lead.tier}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>1 = strongest fit</div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8" }}>Pipeline status</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{formatLeadRowStatus(lead)}</div>
          {lead.noFurtherFollowUp ? (
            <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>No further follow-up flag</div>
          ) : null}
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8" }}>Last contact</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{lead.lastContactDate ?? "Not yet"}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#94a3b8" }}>Latest reply type</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginTop: 2 }}>{formatTouchOutcomeLabel(latestOutcome)}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>From most recent touch</div>
        </div>
      </div>
    </section>
  );
}
