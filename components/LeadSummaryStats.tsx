"use client";

import { useState } from "react";

export type LeadSummaryStatsData = {
  todayEligible: number;
  highTierMissingContact: number;
  dead: number;
};

type Props = {
  stats: LeadSummaryStatsData | null;
  loading: boolean;
  error?: string | null;
};

export function LeadSummaryStats({ stats, loading, error }: Props) {
  const [showDead, setShowDead] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, color: "#475569", fontWeight: 600, margin: "0 0 10px" }}>Pipeline pulse</h2>
      {error ? (
        <p style={{ color: "#b42318", fontSize: 14 }}>{error}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12
          }}
        >
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Ready today</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, lineHeight: 1.1 }}>
              {loading ? "—" : stats?.todayEligible ?? "—"}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>Leads in your 20–30 outreach pool (not dead, under 3 touches).</p>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Strong fits, thin contact</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, lineHeight: 1.1 }}>
              {loading ? "—" : stats?.highTierMissingContact ?? "—"}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>
              Tier 1–2 leads missing email <strong>or</strong> phone — worth enriching first.
            </p>
          </div>
          <div className="card" style={{ margin: 0, opacity: showDead ? 1 : 0.95 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Dead leads</div>
            {showDead ? (
              <>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, lineHeight: 1.1, color: "#64748b" }}>
                  {loading ? "—" : stats?.dead ?? "—"}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>Soft-closed — hidden from today&apos;s list unless you choose to show them.</p>
                <button type="button" style={{ marginTop: 10 }} onClick={() => setShowDead(false)}>
                  Hide count
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10, color: "#94a3b8" }}>Hidden</div>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b" }}>We don&apos;t surface dead leads in your daily queue by default.</p>
                <button type="button" style={{ marginTop: 10 }} onClick={() => setShowDead(true)}>
                  Show dead count
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
