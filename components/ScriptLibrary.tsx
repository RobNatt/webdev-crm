"use client";

import { Script } from "../lib/types";
import { FormEvent } from "react";
import styles from "./ScriptLibrary.module.css";

type Props = {
  scripts: Script[];
  onCreateScript: (payload: { name: string; stage: Script["stage"]; content: string }) => Promise<void>;
  onDeleteScript: (scriptId: number) => Promise<void>;
};

export function ScriptLibrary({ scripts, onCreateScript, onDeleteScript }: Props) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await onCreateScript({
        name: String(formData.get("name") ?? ""),
        stage: String(formData.get("stage") ?? "cold_email") as Script["stage"],
        content: String(formData.get("content") ?? "")
      });
    } finally {
      form.reset();
    }
  };

  return (
    <div className="card">
      <h3 className={styles.title}>Script library</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <input className="input" name="name" placeholder="Script name" required style={{ flex: "1 1 160px", minWidth: 120 }} />
          <select className="select" name="stage" defaultValue="cold_email" style={{ width: "auto", minWidth: 120 }}>
            <option value="cold_email">cold_email</option>
            <option value="cold_call">cold_call</option>
            <option value="follow_up">follow_up</option>
          </select>
          <button type="submit" className="btn">
            Add script
          </button>
        </div>
        <textarea className={`textarea ${styles.textareaField}`} name="content" placeholder="Script content" required rows={4} />
      </form>
      <div className={styles.table}>
        <div className={styles.headRow} role="row">
          <div className={styles.th} role="columnheader">
            Name
          </div>
          <div className={styles.th} role="columnheader">
            Stage
          </div>
          <div className={styles.th} role="columnheader">
            Sends
          </div>
          <div className={styles.th} role="columnheader">
            Replies
          </div>
          <div className={styles.th} role="columnheader">
            Booked
          </div>
          <div className={styles.th} role="columnheader">
            Score
          </div>
          <div className={styles.th} role="columnheader">
            Actions
          </div>
        </div>
        {scripts.map((script) => (
          <div key={script.id} className={styles.row} role="row">
            <div className={styles.td} role="cell">
              {script.name}
            </div>
            <div className={`${styles.td} ${styles.mono}`} role="cell">
              {script.stage}
            </div>
            <div className={`${styles.td} ${styles.mono}`} role="cell">
              {script.totalSends}
            </div>
            <div className={`${styles.td} ${styles.mono}`} role="cell">
              {script.replies}
            </div>
            <div className={`${styles.td} ${styles.mono}`} role="cell">
              {script.bookedCalls}
            </div>
            <div className={`${styles.td} ${styles.mono}`} role="cell">
              {script.performanceScore.toFixed(4)}
            </div>
            <div className={styles.td} role="cell">
              <button type="button" className="btnSecondary" onClick={() => onDeleteScript(script.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
