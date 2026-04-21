"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import { fetchJson } from "../lib/fetchJson";
import type { Lead, LogTouchPayload, Script, TouchpointRow } from "../lib/types";
import { LogTouchModal } from "./LogTouchModal";
import { Toast } from "./Toast";

type Props = {
  leadId: string;
};

export function LeadDetailClient({ leadId }: Props) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [touchpoints, setTouchpoints] = useState<TouchpointRow[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!Number.isFinite(Number(leadId))) {
        setLoadError("Invalid lead id");
        setLead(null);
        setTouchpoints([]);
        return;
      }
      const [leadRes, scriptRes] = await Promise.all([
        apiFetch(`/api/leads/${leadId}`),
        apiFetch("/api/scripts")
      ]);
      const leadJson = await fetchJson<{ lead?: Lead; touchpoints?: TouchpointRow[]; error?: string }>(leadRes);
      const scriptJson = await fetchJson<{ scripts?: Script[]; error?: string }>(scriptRes);
      if (!leadJson.ok) {
        setLoadError(leadJson.data.error ?? "Could not load lead");
        setLead(null);
        setTouchpoints([]);
        return;
      }
      setLead(leadJson.data.lead ?? null);
      setTouchpoints(leadJson.data.touchpoints ?? []);
      if (scriptJson.ok) setScripts(scriptJson.data.scripts ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogTouchSubmit = async (payload: LogTouchPayload) => {
    const response = await apiFetch("/api/touchpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: payload.leadId,
        type: payload.type,
        outcome: payload.outcome,
        notes: payload.notes || undefined
      })
    });
    const { ok, data: json } = await fetchJson<{ error?: string }>(response);
    if (!ok) throw new Error(json.error ?? "Could not log touch");
    showToast("Touch recorded");
    await load();
  };

  const closed =
    lead &&
    (lead.status === "dead" || lead.status === "no_further_follow_up" || lead.touchCount >= 3);

  if (loading) {
    return (
      <main className="container">
        <p>Loading…</p>
      </main>
    );
  }

  if (loadError || !lead) {
    return (
      <main className="container">
        <p style={{ color: "#b42318" }}>{loadError ?? "Lead not found."}</p>
        <Link href="/">Back to dashboard</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <Toast message={toast} />
      <p>
        <Link href="/">← Dashboard</Link>
      </p>
      <h1>{lead.companyName}</h1>
      <p style={{ color: "#64748b" }}>
        Tier {lead.tier} · {lead.status} · {lead.touchCount} touches · Last contact: {lead.lastContactDate ?? "—"}
      </p>
      <div className="row" style={{ marginBottom: 16 }}>
        <button type="button" disabled={Boolean(closed)} onClick={() => setModalOpen(true)}>
          Log touch
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Touch history</h3>
        {touchpoints.length === 0 ? (
          <p>No touchpoints yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Outcome</th>
                <th>Script</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {touchpoints.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleString()}</td>
                  <td>{t.type}</td>
                  <td>{t.outcome}</td>
                  <td>{t.scriptName ?? "—"}</td>
                  <td style={{ maxWidth: 240, whiteSpace: "pre-wrap", fontSize: 13 }}>{t.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LogTouchModal
        lead={lead}
        scripts={scripts}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleLogTouchSubmit}
      />
    </main>
  );
}
