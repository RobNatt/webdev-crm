"use client";

import { Lead } from "../lib/types";
import { useState } from "react";

type Props = {
  title?: string;
  leads: Lead[];
  onLogTouch: (leadId: number, outcome: "no_reply" | "replied" | "booked_call") => Promise<void>;
  onMarkDead: (leadId: number) => Promise<void>;
  readOnly?: boolean;
};

export function LeadList({ title = "Leads", leads, onLogTouch, onMarkDead, readOnly = false }: Props) {
  const [selectedOutcome, setSelectedOutcome] = useState<Record<number, "no_reply" | "replied" | "booked_call">>({});

  return (
    <div className="card">
      <h3>{title}</h3>
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Tier</th>
            <th>Last Contact</th>
            <th>Status</th>
            <th>Next Action</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const closed = lead.status === "dead" || lead.status === "no_further_follow_up" || lead.touchCount >= 3;
            return (
              <tr key={lead.id}>
                <td>{lead.companyName}</td>
                <td>{lead.tier}</td>
                <td>{lead.lastContactDate ?? "-"}</td>
                <td>{lead.status}</td>
                <td>{lead.nextAction}</td>
                <td>
                  <select
                    value={selectedOutcome[lead.id] ?? "no_reply"}
                    onChange={(event) =>
                      setSelectedOutcome((prev) => ({
                        ...prev,
                        [lead.id]: event.target.value as "no_reply" | "replied" | "booked_call"
                      }))
                    }
                    disabled={closed || readOnly}
                  >
                    <option value="no_reply">no_reply</option>
                    <option value="replied">replied</option>
                    <option value="booked_call">booked_call</option>
                  </select>
                  <button
                    disabled={closed || readOnly}
                    onClick={() => onLogTouch(lead.id, selectedOutcome[lead.id] ?? "no_reply")}
                    style={{ marginLeft: 8 }}
                  >
                    Log touch
                  </button>
                  <button style={{ marginLeft: 8 }} disabled={closed || readOnly} onClick={() => onMarkDead(lead.id)}>
                    Mark as dead
                  </button>
                  {closed ? <div style={{ color: "#a33", marginTop: 4 }}>Lead is dead/closed.</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
