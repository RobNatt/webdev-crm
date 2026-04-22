"use client";

import { useCallback, useEffect, useState } from "react";
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
import dashboardStyles from "./DashboardClient.module.css";

export function DashboardClient() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [todo, setTodo] = useState<TodoItem[]>([]);
  const [cap, setCap] = useState<number>(30);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [showDeadInToday, setShowDeadInToday] = useState(false);
  const [leadListVersion, setLeadListVersion] = useState(0);

  const bumpLeadList = () => setLeadListVersion((v) => v + 1);

  const refresh = useCallback(async () => {
    const todoUrl = `/api/today-todo?limit=30${showDeadInToday ? "&includeDead=1" : ""}`;
    const [scriptRes, todoRes, settingsRes] = await Promise.all([
      apiFetch("/api/scripts"),
      apiFetch(todoUrl),
      apiFetch("/api/user-settings")
    ]);
    const scriptJson = await fetchJson<{ scripts?: Script[]; error?: string }>(scriptRes);
    const todoJson = await fetchJson<{ items?: TodoItem[]; effectiveCap?: number; error?: string }>(todoRes);
    const settingsJson = await fetchJson<{
      userSettings?: { maxDailyOutreach: number };
      error?: string;
      hint?: string;
    }>(settingsRes);

    const parts: string[] = [];
    if (!scriptJson.ok) parts.push(`Scripts: ${scriptJson.data.error ?? scriptJson.status}`);
    if (!todoJson.ok) parts.push(`To-do: ${todoJson.data.error ?? todoJson.status}`);
    if (!settingsJson.ok) parts.push(`Settings: ${settingsJson.data.error ?? settingsJson.status}`);
    if (parts.length) {
      const hint = settingsJson.data.hint;
      setMessage(
        `API error — ${parts.join(" · ")}.${hint ? ` ${hint}` : ""} Open /api/health to test the database.`
      );
    }

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
  }, [showDeadInToday]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      bumpLeadList();
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
    bumpLeadList();
  };

  const patchLeadStatus = async (leadId: number, action: "mark_dead" | "unmark_dead") => {
    const res = await apiFetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const { ok, data } = await fetchJson<{ error?: string }>(res);
    if (!ok) {
      setMessage(data.error ?? "Could not update lead.");
      return false;
    }
    return true;
  };

  const handleMarkDead = async (leadId: number) => {
    const ok = await patchLeadStatus(leadId, "mark_dead");
    if (!ok) return;
    setMessage("Lead marked as dead.");
    await refresh();
    bumpLeadList();
  };

  const handleUnmarkDead = async (leadId: number) => {
    const ok = await patchLeadStatus(leadId, "unmark_dead");
    if (!ok) return;
    setMessage("Lead re-opened for follow-up.");
    await refresh();
    bumpLeadList();
  };

  const activeScripts = scripts.filter((s) => s.active).length;

  return (
    <div className={dashboardStyles.page}>
      <header className={dashboardStyles.topbar}>
        <h1 className="topbarTitle">Dashboard</h1>
      </header>
      <Toast message={toast} />
      {message ? <p className={dashboardStyles.message}>{message}</p> : null}
      <div className="workspace">
        <section className={dashboardStyles.sectionStack}>
          <UploadCard onUpload={handleUpload} busy={uploading} />
          <LeadList
            scripts={scripts}
            refreshVersion={leadListVersion}
            activeScripts={activeScripts}
            onLogTouchSubmit={handleLogTouchSubmit}
            onMarkDead={handleMarkDead}
            onUnmarkDead={handleUnmarkDead}
            onFetchError={(msg) => setMessage(msg)}
          />
          <ScriptLibrary scripts={scripts} onCreateScript={handleCreateScript} onDeleteScript={handleDeleteScript} />
        </section>
        <div className="workspaceAside">
          <AIAssistantPanel onAppliedAction={refresh} />
          <TodayToDoPanel
            items={todo}
            cap={cap}
            showDeadInToday={showDeadInToday}
            onShowDeadInTodayChange={setShowDeadInToday}
          />
        </div>
      </div>
    </div>
  );
}
