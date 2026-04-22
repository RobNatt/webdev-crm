"use client";

import { useState } from "react";
import styles from "./LeadSummaryStats.module.css";

export type LeadSummaryStatsData = {
  todayEligible: number;
  highTierMissingContact: number;
  dead: number;
};

type Props = {
  stats: LeadSummaryStatsData | null;
  loading: boolean;
  error?: string | null;
  /** Active script rows in library (fourth metric cell). */
  activeScripts: number;
};

export function LeadSummaryStats({ stats, loading, error, activeScripts }: Props) {
  const [showDead, setShowDead] = useState(false);

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div>
      <h2 className={styles.heading}>Pipeline pulse</h2>
      <div className={styles.strip}>
        <div className={styles.cell}>
          <div className={styles.label}>Ready today</div>
          <div className={styles.value}>{loading ? "—" : stats?.todayEligible ?? "—"}</div>
          <div className={styles.delta}>20–30 pool · not dead · under 3 touches</div>
        </div>
        <div className={styles.cell}>
          <div className={styles.label}>Strong fits, thin contact</div>
          <div className={styles.value}>{loading ? "—" : stats?.highTierMissingContact ?? "—"}</div>
          <div className={styles.delta}>Tier 1–2 · missing email or phone</div>
        </div>
        <div className={styles.cell}>
          <div className={styles.label}>Dead leads</div>
          {showDead ? (
            <>
              <div className={styles.value}>{loading ? "—" : stats?.dead ?? "—"}</div>
              <div className={styles.delta}>Soft-closed · off today&apos;s queue by default</div>
              <button type="button" className="btnSecondary" style={{ marginTop: 12 }} onClick={() => setShowDead(false)}>
                Hide count
              </button>
            </>
          ) : (
            <>
              <div className={styles.hiddenLabel}>Hidden</div>
              <div className={styles.delta}>Not shown in daily queue unless toggled</div>
              <button type="button" className="btnSecondary" style={{ marginTop: 12 }} onClick={() => setShowDead(true)}>
                Show dead count
              </button>
            </>
          )}
        </div>
        <div className={styles.cell}>
          <div className={styles.label}>Active scripts</div>
          <div className={styles.value}>{activeScripts}</div>
          <div className={styles.delta}>Library · used for logging &amp; queue</div>
        </div>
      </div>
    </div>
  );
}
