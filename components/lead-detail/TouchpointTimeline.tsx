"use client";

import type { TouchpointRow } from "../../lib/types";
import { formatTouchOutcomeLabel } from "../../lib/leadStatusLabels";
import styles from "./TouchpointTimeline.module.css";

type Props = {
  touchpoints: TouchpointRow[];
};

function methodLabel(type: string) {
  return type === "call" ? "Call" : "Email";
}

export function TouchpointTimeline({ touchpoints }: Props) {
  const chronological = [...touchpoints].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <section className={`card ${styles.section}`} aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className={styles.title}>
        Touchpoint timeline
      </h2>
      <p className={styles.intro}>Every outreach attempt in order — date, channel, outcome, and your notes.</p>
      {chronological.length === 0 ? (
        <p className={styles.empty}>No touches logged yet. Use “Log this touch” in the section below to start the cadence.</p>
      ) : (
        <div className={styles.rail}>
          {chronological.map((t) => (
            <div key={t.id} className={styles.item}>
              <span aria-hidden className={styles.marker} />
              <div className={styles.date}>{new Date(t.date).toLocaleString()}</div>
              <div className={styles.row}>
                <span className={styles.method}>{methodLabel(t.type)}</span>
                <span className={styles.outcome}>{formatTouchOutcomeLabel(t.outcome)}</span>
                {t.scriptName ? <span className={styles.script}>Script: {t.scriptName}</span> : null}
              </div>
              {t.notes ? (
                <p className={styles.notes}>{t.notes}</p>
              ) : (
                <p className={styles.notesEmpty}>No notes on this touch.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
