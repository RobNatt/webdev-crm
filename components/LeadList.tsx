"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lead, LogTouchPayload, Script } from "../lib/types";
import { LogTouchModal } from "./LogTouchModal";

type Props = {
  title?: string;
  leads: Lead[];
  scripts: Script[];
  onLogTouchSubmit: (payload: LogTouchPayload) => Promise<void>;
  onMarkDead: (leadId: number) => Promise<void>;
  readOnly?: boolean;
};

export function LeadList({ title = "Leads", leads, scripts, onLogTouchSubmit, onMarkDead, readOnly = false }: Props) {
  const [touchLead, setTouchLead] = useState<Lead | null>(null);

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
                <td>
                  <Link href={`/leads/${lead.id}`}>{lead.companyName}</Link>
                </td>
                <td>{lead.tier}</td>
                <td>{lead.lastContactDate ?? "-"}</td>
                <td>{lead.status}</td>
                <td>{lead.nextAction}</td>
                <td>
                  <button
                    type="button"
                    disabled={closed || readOnly}
                    onClick={() => {
                      if (!closed && !readOnly) setTouchLead(lead);
                    }}
                  >
                    Log touch
                  </button>
                  <button
                    type="button"
                    style={{ marginLeft: 8 }}
                    disabled={closed || readOnly}
                    onClick={() => onMarkDead(lead.id)}
                  >
                    Mark as dead
                  </button>
                  {closed ? <div style={{ color: "#a33", marginTop: 4 }}>Lead is dead/closed.</div> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <LogTouchModal
        lead={touchLead}
        scripts={scripts}
        open={touchLead !== null}
        onClose={() => setTouchLead(null)}
        onSubmit={onLogTouchSubmit}
      />
    </div>
  );
}
