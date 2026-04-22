"use client";

import Link from "next/link";
import type { Lead } from "../lib/types";
import { formatLeadRowStatus, formatTouchOutcomeLabel } from "../lib/leadStatusLabels";
import styles from "./LeadTable.module.css";

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
      <div className={styles.wrap}>
        <div className={styles.grid}>
          <div className={styles.headRow} role="row">
            <div className={styles.th} role="columnheader">
              Company
            </div>
            <div className={styles.th} role="columnheader">
              Website
            </div>
            <div className={styles.th} role="columnheader">
              Tier
            </div>
            <div className={styles.th} role="columnheader">
              Status
            </div>
            <div className={styles.th} role="columnheader">
              Last contact
            </div>
            <div className={styles.th} role="columnheader">
              Next action
            </div>
            <div className={styles.th} role="columnheader">
              Reply type
            </div>
            <div className={styles.th} role="columnheader">
              Actions
            </div>
          </div>

          {loading ? (
            <div className={styles.row} role="row">
              <div className={styles.td} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.emptyLabel}>Loading</div>
                <p className={styles.meta} style={{ textAlign: "center" }}>
                  Fetching leads…
                </p>
              </div>
            </div>
          ) : leads.length === 0 ? (
            <div className={styles.row} role="row">
              <div className={styles.td} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.empty}>
                  <div className={styles.emptyLabel}>No matches</div>
                  <button type="button" className="btn" onClick={() => onPageChange(1)}>
                    Back to first page
                  </button>
                </div>
              </div>
            </div>
          ) : (
            leads.map((lead) => {
              const isDead = lead.status === "dead";
              const closed = isDead || lead.status === "no_further_follow_up" || lead.touchCount >= 3;
              const href = websiteHref(lead.website);
              return (
                <div key={lead.id} className={styles.row} role="row">
                  <div className={styles.td} role="cell">
                    <span>{lead.companyName}</span>
                    {isDead ? <span className={styles.deadMark}>Dead</span> : null}
                    {lead.location ? <div className={styles.meta}>{lead.location}</div> : null}
                  </div>
                  <div className={`${styles.td} ${styles.mono}`} role="cell">
                    {href ? (
                      <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
                        {lead.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                  <div className={`${styles.td} ${styles.mono}`} role="cell">
                    {lead.tier}
                  </div>
                  <div className={styles.td} role="cell">
                    {formatLeadRowStatus(lead)}
                  </div>
                  <div className={`${styles.td} ${styles.mono}`} role="cell">
                    {lead.lastContactDate ?? "—"}
                  </div>
                  <div className={`${styles.td} ${styles.mono}`} role="cell">
                    {lead.nextAction}
                  </div>
                  <div className={styles.td} role="cell">
                    {formatTouchOutcomeLabel(lead.lastTouchOutcome)}
                  </div>
                  <div className={styles.td} role="cell">
                    <div className={styles.actions}>
                      <button type="button" className="btnSecondary" disabled={closed} onClick={() => !closed && onLogTouch(lead)}>
                        Log touch
                      </button>
                      {!isDead ? (
                        <button type="button" className="btnSecondary" disabled={closed} onClick={() => !closed && onMarkDead(lead.id)}>
                          Mark dead
                        </button>
                      ) : onUnmarkDead ? (
                        <button type="button" className="btnSecondary" onClick={() => void onUnmarkDead(lead.id)}>
                          Un-mark dead
                        </button>
                      ) : null}
                      <Link href={`/leads/${lead.id}`} className={styles.linkBtn}>
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.pager}>
        <span className={styles.pagerMeta}>
          {total === 0 ? "0 leads" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </span>
        <div className={styles.pagerNav}>
          <button type="button" className="btnSecondary" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <span className={styles.pagerPage}>
            Page {page} / {totalPages}
          </span>
          <button type="button" className="btnSecondary" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
