"use client";

import { useEffect, useMemo, useState } from "react";
import { LeadList } from "./LeadList";
import { ScriptLibrary } from "./ScriptLibrary";
import { Toast } from "./Toast";
import { TodayToDoPanel } from "./TodayToDoPanel";
import { UploadCard } from "./UploadCard";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { apiFetch } from "../lib/apiFetch";
import { fetchJson } from "../lib/fetchJson";
import { mapCsvRowToApiLead, parseLeadsCsv } from "../lib/parseLeadsCsv";
import type { Lead, LogTouchPayload, Script, TodoItem } from "../lib/types";

export function DashboardClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [todo, setTodo] = useState<TodoItem[]>([]);
  const [cap, setCap] = useState<number>(30);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [showDeadLeads, setShowDeadLeads] = useState(false);

  const refresh = async () => {
    const [leadRes, scriptRes, todoRes, settingsRes] = await Promise.all([
      apiFetch("/api/leads"),
      apiFetch("/api/scripts"),
      apiFetch("/api/today-todo?limit=30"),
      apiFetch("/api/user-settings")
    ]);
    const leadJson = await fetchJson<{ leads?: Lead[]; error?: string; hint?: string }>(leadRes);
    const scriptJson = await fetchJson<{ scripts?: Script[]; error?: string }>(scriptRes);
    const todoJson = await fetchJson<{ items?: TodoItem[]; effectiveCap?: number; error?: string }>(todoRes);
    const settingsJson = await fetchJson<{
      userSettings?: { maxDailyOutreach: number };
      error?: string;
      hint?: string;
    }>(settingsRes);

    const parts: string[] = [];
    if (!leadJson.ok) parts.push(`Leads: ${leadJson.data.error ?? leadJson.status}`);
    if (!scriptJson.ok) parts.push(`Scripts: ${scriptJson.data.error ?? scriptJson.status}`);
    if (!todoJson.ok) parts.push(`To-do: ${todoJson.data.error ?? todoJson.status}`);
    if (!settingsJson.ok) parts.push(`Settings: ${settingsJson.data.error ?? settingsJson.status}`);
    if (parts.length) {
      const hint = leadJson.data.hint ?? settingsJson.data.hint;
      setMessage(
        `API error — ${parts.join(" · ")}.${hint ? ` ${hint}` : ""} Open /api/health to test the database.`
      );
    }

    if (leadJson.ok) setLeads(leadJson.data.leads ?? []);
    if (scriptJson.ok) setScripts(scriptJson.data.scripts ?? []);
    if (todoJson.ok) {
      setTodo(todoJson.data.items ?? []);
      setCap(
        todoJson.data.effectiveCap ??
          (settingsJson.ok ? settingsJson.data.userSettings?.maxDailyOutreach : undefined) ??
          30
      );
    } else if (settingsJson.ok) {
      setCap(settingsJson.data.userSettings?.maxDailyOutreach ?? 30);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const activeLeads = useMemo(() => leads.filter((lead) => lead.status !== "dead"), [leads]);
  const deadLeads = useMemo(() => leads.filter((lead) => lead.status === "dead"), [leads]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setMessage("");
    try {
      const text = await file.text();
      const rawRows = parseLeadsCsv(text);
      if (rawRows.length === 0) {
        setMessage("Could not read CSV: need a header row and at least one data row.");
        return;
      }
      const rowsToSend = rawRows.map(mapCsvRowToApiLead).filter((row) => row.company_name.trim().length > 0);
      if (rowsToSend.length === 0) {
        setMessage(
          "No business names found. Use a column like company_name, Title, Name, or business (Google Maps exports often use Title)."
        );
        return;
      }
      const response = await apiFetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: rowsToSend })
      });
      const { ok, data: json } = await fetchJson<{
        createdCount?: number;
        skippedDuplicates?: number;
        skippedEmpty?: number;
        error?: string;
        hint?: string;
        leads?: Lead[];
      }>(response);
      if (!ok) {
        setMessage(`${json.error ?? `Upload failed (${response.status})`}${json.hint ? `. ${json.hint}` : ""}`);
        return;
      }
      setMessage(
        `Import finished: ${json.createdCount ?? 0} added, ${json.skippedDuplicates ?? 0} duplicates skipped, ${json.skippedEmpty ?? 0} missing company name (${rowsToSend.length} data rows sent).`
      );
      const created = json.leads;
      if (created?.length) {
        setLeads((prev) => {
          const merged = new Map<number, Lead>(prev.map((l) => [l.id, l]));
          for (const row of created) merged.set(row.id, row);
          return Array.from(merged.values()).sort((a, b) => a.id - b.id);
        });
      }
      await refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateScript = async (payload: { name: string; stage: Script["stage"]; content: string }) => {
    const res = await apiFetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const { ok, data } = await fetchJson<{ error?: string }>(res);
    if (!ok) {
      setMessage(data.error ?? "Could not create script.");
      return;
    }
    setMessage("Script added.");
    await refresh();
  };

  const handleDeleteScript = async (scriptId: number) => {
    const response = await apiFetch(`/api/scripts/${scriptId}`, { method: "DELETE" });
    const { ok, data } = await fetchJson<{ error?: string }>(response);
    if (!ok) {
      setMessage(data.error ?? "Could not delete script.");
      return;
    }
    setMessage("Script deleted.");
    await refresh();
  };

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
    if (!ok) throw new Error(json.error ?? "Could not log touchpoint.");
    setToast("Touch recorded");
    window.setTimeout(() => setToast(null), 4000);
    await refresh();
  };

  const handleMarkDead = async (leadId: number) => {
    const res = await apiFetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_dead" })
    });
    const { ok, data } = await fetchJson<{ error?: string }>(res);
    if (!ok) {
      setMessage(data.error ?? "Could not update lead.");
      return;
    }
    setMessage("Lead marked as dead.");
    await refresh();
  };

  return (
    <main className="container">
      <h1>webdev-crm</h1>
      <p>AI-assisted outreach workflow with 3-touch cadence and 20-30/day hard cap.</p>
      <Toast message={toast} />
      {message ? <p>{message}</p> : null}
      <div className="row" style={{ marginBottom: 8 }}>
        <button onClick={() => setShowDeadLeads((prev) => !prev)}>
          {showDeadLeads ? "Back to Active Leads" : `Dead Leads (${deadLeads.length})`}
        </button>
      </div>
      <div className="workspace">
        <section style={{ minWidth: 0 }}>
          <UploadCard onUpload={handleUpload} busy={uploading} />
          <div style={{ marginTop: 16 }}>
            {showDeadLeads ? (
              <LeadList
                title="Dead Leads"
                leads={deadLeads}
                scripts={scripts}
                onLogTouchSubmit={handleLogTouchSubmit}
                onMarkDead={handleMarkDead}
                readOnly
              />
            ) : (
              <LeadList
                title="Active Leads"
                leads={activeLeads}
                scripts={scripts}
                onLogTouchSubmit={handleLogTouchSubmit}
                onMarkDead={handleMarkDead}
              />
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <ScriptLibrary scripts={scripts} onCreateScript={handleCreateScript} onDeleteScript={handleDeleteScript} />
          </div>
        </section>
        <div className="workspace-aside">
          <AIAssistantPanel onAppliedAction={refresh} />
          <TodayToDoPanel items={todo} cap={cap} />
        </div>
      </div>
    </main>
  );
}
