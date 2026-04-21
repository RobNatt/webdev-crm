"use client";

import type { LastContactWindow, LeadListTab, LeadStageFilter } from "../lib/leadsListParams";

const STAGE_OPTIONS: { value: LeadStageFilter; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "booked", label: "Booked" },
  { value: "dead", label: "Dead" }
];

type Props = {
  tab: LeadListTab;
  onTab: (tab: LeadListTab) => void;
  search: string;
  onSearch: (value: string) => void;
  stages: LeadStageFilter[];
  onToggleStage: (stage: LeadStageFilter) => void;
  tiers: number[];
  onToggleTier: (tier: number) => void;
  lastContact: LastContactWindow;
  onLastContact: (value: LastContactWindow) => void;
};

export function LeadFilters({
  tab,
  onTab,
  search,
  onSearch,
  stages,
  onToggleStage,
  tiers,
  onToggleTier,
  lastContact,
  onLastContact
}: Props) {
  return (
    <div className="lead-filters">
      <div className="row" style={{ flexWrap: "wrap", marginBottom: 10, gap: 8 }}>
        <button type="button" onClick={() => onTab("all")} disabled={tab === "all"} style={{ fontWeight: tab === "all" ? 700 : 400 }}>
          All leads
        </button>
        <button
          type="button"
          onClick={() => onTab("today")}
          disabled={tab === "today"}
          style={{ fontWeight: tab === "today" ? 700 : 400 }}
          title="Not dead, under 3 touches, not booked or opted out"
        >
          Today (20–30 pool)
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label htmlFor="lead-search" style={{ display: "block", fontSize: 13, marginBottom: 4, color: "#475569" }}>
          Search (company, location, owner)
        </label>
        <input
          id="lead-search"
          type="search"
          placeholder="Type to filter…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ width: "100%", maxWidth: 420 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Status</span>
        <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
          {STAGE_OPTIONS.map(({ value, label }) => {
            const on = stages.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onToggleStage(value)}
                style={{
                  borderColor: on ? "#2563eb" : undefined,
                  background: on ? "#eff6ff" : undefined
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        <div>
          <span style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Tier</span>
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = tiers.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onToggleTier(n)}
                  style={{
                    borderColor: on ? "#2563eb" : undefined,
                    background: on ? "#eff6ff" : undefined
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label htmlFor="lead-last-contact" style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 4 }}>
            Last contact
          </label>
          <select id="lead-last-contact" value={lastContact} onChange={(e) => onLastContact(e.target.value as LastContactWindow)}>
            <option value="any">Any</option>
            <option value="none">No contact yet</option>
            <option value="over7">Last contact over 7 days ago</option>
            <option value="within7">Last contact within 7 days</option>
          </select>
        </div>
      </div>
    </div>
  );
}
