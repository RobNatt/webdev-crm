"use client";

import { Script } from "../lib/types";
import { FormEvent } from "react";

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
      <h3>Script Library</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <div className="row">
          <input name="name" placeholder="Script name" required />
          <select name="stage" defaultValue="cold_email">
            <option value="cold_email">cold_email</option>
            <option value="cold_call">cold_call</option>
            <option value="follow_up">follow_up</option>
          </select>
          <button type="submit">Add Script</button>
        </div>
        <textarea name="content" placeholder="Script content" required style={{ width: "100%", marginTop: 8 }} />
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Stage</th>
            <th>Total Sends</th>
            <th>Replies</th>
            <th>Booked Calls</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {scripts.map((script) => (
            <tr key={script.id}>
              <td>{script.name}</td>
              <td>{script.stage}</td>
              <td>{script.totalSends}</td>
              <td>{script.replies}</td>
              <td>{script.bookedCalls}</td>
              <td>{script.performanceScore.toFixed(4)}</td>
              <td>
                <button type="button" onClick={() => onDeleteScript(script.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
