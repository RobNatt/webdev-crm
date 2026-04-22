"use client";

import type { LastContactWindow, LeadListTab, LeadStageFilter } from "../lib/leadsListParams";
import styles from "./LeadFilters.module.css";

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
    <div>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`btnSecondary ${tab === "all" ? styles.chipActive : ""}`}
          onClick={() => onTab("all")}
          aria-pressed={tab === "all"}
        >
          All leads
        </button>
        <button
          type="button"
          className={`btnSecondary ${tab === "today" ? styles.chipActive : ""}`}
          onClick={() => onTab("today")}
          aria-pressed={tab === "today"}
          title="Not dead, under 3 touches, not booked or opted out"
        >
          Today (20–30 pool)
        </button>
      </div>

      <div className={styles.searchBlock}>
        <label htmlFor="lead-search" className="fieldLabel">
          Search (company, location, owner)
        </label>
        <input
          id="lead-search"
          className="input"
          type="search"
          placeholder="Type to filter…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ maxWidth: 420 }}
        />
      </div>

      <div className={styles.stages}>
        <span className="fieldLabel">Status</span>
        <div className={styles.stageRow}>
          {STAGE_OPTIONS.map(({ value, label }) => {
            const on = stages.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`btnSecondary ${on ? styles.chipActive : ""}`}
                onClick={() => onToggleStage(value)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <span className="fieldLabel">Tier</span>
          <div className={styles.tierRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = tiers.includes(n);
              return (
                <button key={n} type="button" className={`btnSecondary ${on ? styles.chipActive : ""}`} onClick={() => onToggleTier(n)}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label htmlFor="lead-last-contact" className="fieldLabel">
            Last contact
          </label>
          <select id="lead-last-contact" className="select" value={lastContact} onChange={(e) => onLastContact(e.target.value as LastContactWindow)} style={{ width: "auto", minWidth: 200 }}>
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
