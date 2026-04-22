"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import { fetchJson } from "../lib/fetchJson";
import type { Lead, LogTouchPayload, Script, TouchpointRow } from "../lib/types";
import { LeadDetailSummary } from "./lead-detail/LeadDetailSummary";
import { LogTouchSection } from "./lead-detail/LogTouchSection";
import { TouchpointTimeline } from "./lead-detail/TouchpointTimeline";
import { Toast } from "./Toast";
import detailStyles from "./LeadDetailClient.module.css";

type Props = {
  leadId: string;
};

export function LeadDetailClient({ leadId }: Props) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [touchpoints, setTouchpoints] = useState<TouchpointRow[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const scrollToLogTouch = () => {
    document.getElementById("log-touch")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const body: Record<string, unknown> = {
      lead_id: payload.leadId,
      type: payload.type,
      outcome: payload.outcome,
      notes: payload.notes || undefined
    };
    if (typeof payload.scriptId === "number" && Number.isFinite(payload.scriptId)) {
      body.script_id = payload.scriptId;
    }
    const response = await apiFetch("/api/touchpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const { ok, data: json } = await fetchJson<{ error?: string }>(response);
    if (!ok) throw new Error(json.error ?? "Could not log touch");
    showToast("Touch saved — timeline updated.");
    await load();
  };

  const isDead = lead?.status === "dead";
  const closed =
    lead &&
    (lead.status === "dead" || lead.status === "no_further_follow_up" || lead.touchCount >= 3);

  const patchLeadStatus = async (action: "mark_dead" | "unmark_dead") => {
    const response = await apiFetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const { ok, data: json } = await fetchJson<{ error?: string }>(response);
    if (!ok) {
      showToast(json.error ?? "Could not update lead.");
      return;
    }
    showToast(action === "mark_dead" ? "Marked as dead" : "Re-opened for follow-up");
    await load();
  };

  if (loading) {
    return (
      <div className={detailStyles.page}>
        <p className={detailStyles.muted}>Loading…</p>
      </div>
    );
  }

  if (loadError || !lead) {
    return (
      <div className={detailStyles.page}>
        <p className={detailStyles.muted}>{loadError ?? "Lead not found."}</p>
        <Link href="/" className={detailStyles.back}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={detailStyles.page}>
      <Toast message={toast} />
      <div className={detailStyles.topbar}>
        <Link href="/" className={detailStyles.back}>
          ← Back to dashboard
        </Link>
        <h1 className="topbarTitle">Lead record</h1>
      </div>

      <header className={detailStyles.headerBlock}>
        <h2 className="pageTitle">{lead.companyName}</h2>
        <p className={detailStyles.sub}>
          <span className="mono">{lead.touchCount}</span> touch{lead.touchCount === 1 ? "" : "es"} logged
        </p>
        <div className={detailStyles.actions}>
          <button type="button" className="btn" disabled={Boolean(closed)} onClick={scrollToLogTouch}>
            Log touch
          </button>
          {!isDead ? (
            <button type="button" className="btnSecondary" disabled={Boolean(closed)} onClick={() => void patchLeadStatus("mark_dead")}>
              Mark as dead
            </button>
          ) : (
            <button type="button" className="btnSecondary" onClick={() => void patchLeadStatus("unmark_dead")}>
              Un-mark as dead
            </button>
          )}
        </div>
      </header>

      <LeadDetailSummary lead={lead} touchpointsNewestFirst={touchpoints} />
      <TouchpointTimeline touchpoints={touchpoints} />
      <LogTouchSection
        lead={lead}
        touchpointsNewestFirst={touchpoints}
        scripts={scripts}
        disabled={Boolean(closed)}
        onSubmit={handleLogTouchSubmit}
      />
    </div>
  );
}
