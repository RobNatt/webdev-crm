"use client";

import { TodoItem } from "../lib/types";
import styles from "./TodayToDoPanel.module.css";

type Props = {
  items: TodoItem[];
  cap: number;
  showDeadInToday: boolean;
  onShowDeadInTodayChange: (value: boolean) => void;
};

export function TodayToDoPanel({ items, cap, showDeadInToday, onShowDeadInTodayChange }: Props) {
  const reachedCap = items.length >= cap;

  return (
    <div className="card">
      <div className={styles.header}>
        <h3 className={styles.title}>Today&apos;s to-do</h3>
        <span className={styles.cap}>
          {items.length}/{cap}
        </span>
      </div>
      <label className={styles.checkboxRow}>
        <input type="checkbox" checked={showDeadInToday} onChange={(e) => onShowDeadInTodayChange(e.target.checked)} />
        <span>Show dead in today&apos;s list</span>
      </label>
      {reachedCap ? <p className={styles.capNote}>Daily cap reached. No new tasks allowed.</p> : null}
      <div className={styles.table}>
        <div className={styles.headRow} role="row">
          <div className={styles.th} role="columnheader">
            Lead
          </div>
          <div className={styles.th} role="columnheader">
            Method
          </div>
          <div className={styles.th} role="columnheader">
            Script
          </div>
          <div className={styles.th} role="columnheader">
            Queue
          </div>
        </div>
        {items.map((todo) => {
          const overdue = Boolean(todo.overdue);
          return (
            <div key={todo.id} className={styles.row} role="row">
              <div className={styles.td} role="cell">
                <div className={styles.leadCell}>
                  <span className={styles.statusDot} aria-hidden>
                    {overdue ? <span className={styles.statusPending}>○</span> : <span className={styles.statusActive}>●</span>}
                  </span>
                  <span>{todo.leadName}</span>
                  {todo.leadStatus === "dead" ? <span className={styles.deadTag}>Dead</span> : null}
                </div>
              </div>
              <div className={`${styles.td} ${styles.mono}`} role="cell">
                {todo.method}
              </div>
              <div className={styles.td} role="cell">
                {todo.scriptName}
              </div>
              <div className={styles.td} role="cell">
                <span className={overdue ? styles.statusPending : styles.statusActive}>{overdue ? "Overdue" : "Due"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
