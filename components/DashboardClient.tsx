"use client";

import { useEffect, useMemo, useState } from "react";
import { LeadList } from "./LeadList";
import { ScriptLibrary } from "./ScriptLibrary";
import { TodayToDoPanel } from "./TodayToDoPanel";
import { UploadCard } from "./UploadCard";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { Lead, Script, TodoItem } from "../lib/types";

const parseCsv = async (file: File): Promise<Record<string, string>[]> => {
  const text = await file.text();
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((value) => value.trim());
  return lines.map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
};

export function DashboardClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [todo, setTodo] = useState<TodoItem[]>([]);
  const [cap, setCap] = useState<number>(30);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [showDeadLeads, setShowDeadLeads] = useState(false);

  const refresh = async () => {
    const [leadRes, scriptRes, todoRes, settingsRes] = await Promise.all([
      fetch("/api/leads"),
      fetch("/api/scripts"),
      fetch("/api/today-todo?limit=30"),
      fetch("/api/user-settings")
    ]);
    const leadJson = await leadRes.json();
    const scriptJson = await scriptRes.json();
    const todoJson = await todoRes.json();
    const settingsJson = await settingsRes.json();

    setLeads(leadJson.leads ?? []);
    setScripts(scriptJson.scripts ?? []);
    setTodo(todoJson.items ?? []);
    setCap(todoJson.effectiveCap ?? settingsJson.userSettings?.maxDailyOutreach ?? 30);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const activeLeads = useMemo(() => leads.filter((lead) => lead.status !== "dead"), [leads]);
  const deadLeads = useMemo(() => leads.filter((lead) => lead.status === "dead"), [leads]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const parsed = await parseCsv(file);
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: parsed })
      });
      const json = await response.json();
      setMessage(`Imported ${json.createdCount ?? 0} leads. Skipped ${json.skippedDuplicates ?? 0} duplicates.`);
      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const handleCreateScript = async (payload: { name: string; stage: Script["stage"]; content: string }) => {
    await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setMessage("Script added.");
    await refresh();
  };

  const handleDeleteScript = async (scriptId: number) => {
    const response = await fetch(`/api/scripts/${scriptId}`, { method: "DELETE" });
    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      setMessage((json as { error?: string }).error ?? "Could not delete script.");
      return;
    }
    setMessage("Script deleted.");
    await refresh();
  };

  const handleLogTouch = async (leadId: number, outcome: "no_reply" | "replied" | "booked_call") => {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) return;
    const recommended = scripts
      .filter((script) => script.tier === lead.tier && script.active)
      .sort((a, b) => b.performanceScore - a.performanceScore)[0];
    if (!recommended) {
      setMessage("No active script found for this tier.");
      return;
    }

    const response = await fetch("/api/touchpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        script_id: recommended.id,
        type: lead.preferredContactMethod,
        outcome
      })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Could not log touchpoint.");
      return;
    }
    setMessage("Touchpoint logged.");
    await refresh();
  };

  const handleMarkDead = async (leadId: number) => {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_dead" })
    });
    setMessage("Lead marked as dead.");
    await refresh();
  };

  return (
    <main className="container">
      <h1>webdev-crm</h1>
      <p>AI-assisted outreach workflow with 3-touch cadence and 20-30/day hard cap.</p>
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
                onLogTouch={handleLogTouch}
                onMarkDead={handleMarkDead}
                readOnly
              />
            ) : (
              <LeadList title="Active Leads" leads={activeLeads} onLogTouch={handleLogTouch} onMarkDead={handleMarkDead} />
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
