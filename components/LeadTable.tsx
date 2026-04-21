"use client";

import Link from "next/link";
import type { Lead } from "../lib/types";
import { formatLeadRowStatus, formatTouchOutcomeLabel } from "../lib/leadStatusLabels";

type Props = {
  leads: Lead[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onLogTouch: (lead: Lead) => void;
  onMarkDead: (leadId: number) => void;
  onUnmarkDead?: (leadId: number) => Promise<void>;
};

function websiteHref(raw: string | undefined) {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function LeadTable({
  leads,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onLogTouch,
  onMarkDead,
  onUnmarkDead
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <table style={{ width: "100%", minWidth: 920, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th style={{ padding: "8px 10px" }}>Company</th>
              <th style={{ padding: "8px 10px" }}>Website</th>
              <th style={{ padding: "8px 10px" }}>Tier</th>
              <th style={{ padding: "8px 10px" }}>Status</th>
              <th style={{ padding: "8px 10px" }}>Last contact</th>
              <th style={{ padding: "8px 10px" }}>Next action</th>
              <th style={{ padding: "8px 10px" }}>Reply type</th>
              <th style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, color: "#64748b" }}>
                  Loading leads…
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 24, color: "#64748b" }}>
                  No leads match these filters.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const isDead = lead.status === "dead";
                const closed =
                  isDead || lead.status === "no_further_follow_up" || lead.touchCount >= 3;
                const href = websiteHref(lead.website);
                return (
                  <tr key={lead.id} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                      <span style={{ fontWeight: 600 }}>{lead.companyName}</span>
                      {isDead ? (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "#f1f5f9",
                            color: "#64748b"
                          }}
                        >
                          Dead
                        </span>
                      ) : null}
                      {lead.location ? (
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{lead.location}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: "8px 10px", verticalAlign: "top", maxWidth: 200 }}>
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
                          {lead.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{lead.tier}</td>
                    <td style={{ padding: "8px 10px" }}>{formatLeadRowStatus(lead)}</td>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{lead.lastContactDate ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>{lead.nextAction}</td>
                    <td style={{ padding: "8px 10px" }}>{formatTouchOutcomeLabel(lead.lastTouchOutcome)}</td>
                    <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
                        <button type="button" disabled={closed} onClick={() => !closed && onLogTouch(lead)}>
                          Log touch
                        </button>
                        {!isDead ? (
                          <button type="button" disabled={closed} onClick={() => !closed && onMarkDead(lead.id)}>
                            Mark dead
                          </button>
                        ) : onUnmarkDead ? (
                          <button type="button" onClick={() => void onUnmarkDead(lead.id)}>
                            Un-mark dead
                          </button>
                        ) : null}
                        <Link
                          href={`/leads/${lead.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            border: "1px solid #ccd5e6",
                            borderRadius: 8,
                            textDecoration: "none",
                            color: "#172033",
                            fontSize: 13
                          }}
                        >
                          View details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="between" style={{ marginTop: 10, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>
          {total === 0 ? "0 leads" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        <div className="row">
          <button type="button" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span style={{ fontSize: 13, padding: "0 8px" }}>
            Page {page} / {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
