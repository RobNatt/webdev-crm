"use client";

import type { Lead, TouchpointRow } from "../../lib/types";
import { formatLeadRowStatus, formatTouchOutcomeLabel } from "../../lib/leadStatusLabels";
import styles from "./LeadDetailSummary.module.css";

type Props = {
  lead: Lead;
  touchpointsNewestFirst: TouchpointRow[];
};

export function LeadDetailSummary({ lead, touchpointsNewestFirst }: Props) {
  const latestOutcome = touchpointsNewestFirst[0]?.outcome;

  return (
    <section className={`card ${styles.section}`} aria-labelledby="lead-summary-heading">
      <h2 id="lead-summary-heading" className={styles.title}>
        At a glance
      </h2>
      <div className={styles.grid}>
        <div>
          <div className={styles.label}>Company</div>
          <div className={styles.company}>{lead.companyName}</div>
          {lead.location ? <div className={styles.meta}>{lead.location}</div> : null}
        </div>
        <div>
          <div className={styles.label}>Tier</div>
          <div className={styles.mono}>{lead.tier}</div>
          <div className={styles.meta}>1 = strongest fit</div>
        </div>
        <div>
          <div className={styles.label}>Pipeline status</div>
          <div className={styles.value}>{formatLeadRowStatus(lead)}</div>
          {lead.noFurtherFollowUp ? <div className={styles.flag}>No further follow-up flag</div> : null}
        </div>
        <div>
          <div className={styles.label}>Last contact</div>
          <div className={styles.mono}>{lead.lastContactDate ?? "Not yet"}</div>
        </div>
        <div>
          <div className={styles.label}>Latest reply type</div>
          <div className={styles.value}>{formatTouchOutcomeLabel(latestOutcome)}</div>
          <div className={styles.meta}>From most recent touch</div>
        </div>
      </div>
    </section>
  );
}
