"use client";

import { TodoItem } from "../lib/types";

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
      <div className="between">
        <h3>Today&apos;s To-Do</h3>
        <strong>
          {items.length}/{cap}
        </strong>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 14 }}>
        <input
          type="checkbox"
          checked={showDeadInToday}
          onChange={(e) => onShowDeadInTodayChange(e.target.checked)}
        />
        Show dead in today&apos;s list
      </label>
      {reachedCap ? <p style={{ color: "#a33" }}>Daily cap reached. No new tasks allowed.</p> : null}
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Method</th>
            <th>Script</th>
            <th>Overdue</th>
          </tr>
        </thead>
        <tbody>
          {items.map((todo) => (
            <tr key={todo.id}>
              <td>
                {todo.leadName}
                {todo.leadStatus === "dead" ? (
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
              </td>
              <td>{todo.method}</td>
              <td>{todo.scriptName}</td>
              <td>{todo.overdue ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
