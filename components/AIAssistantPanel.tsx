"use client";

import { experimental_useObject } from "@ai-sdk/react";
import { FormEvent, useMemo, useState } from "react";
import { crmAssistantResultSchema, type CrmAssistantResult } from "../lib/crmAiSchema";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; crm?: CrmAssistantResult };

type Props = {
  onAppliedAction: () => Promise<void>;
};

function parseSlashCommand(raw: string) {
  const message = raw.trim();
  if (!message.startsWith("/")) return { command: null as string | null, message };
  const command = message.split(/\s+/)[0] ?? null;
  return { command, message };
}

export function AIAssistantPanel({ onAppliedAction }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: "Ask me: /today, /enrich, /scripts or natural language. Uses Groq when GROQ_API_KEY is set." }
  ]);
  const [input, setInput] = useState("");
  const [dockMode, setDockMode] = useState<"right" | "bottom">("right");
  const [panelWidth, setPanelWidth] = useState(360);
  const [panelHeight, setPanelHeight] = useState(260);

  const { object, submit, isLoading, error, clear } = experimental_useObject({
    api: "/api/ai/chat",
    schema: crmAssistantResultSchema,
    fetch: async (url, options) => {
      const res = await fetch(url, options);
      if (!res.ok) {
        const body = await res.text();
        let detail = body;
        try {
          const j = JSON.parse(body) as { error?: string };
          if (j.error) detail = j.error;
        } catch {
          /* keep text */
        }
        throw new Error(detail || `Request failed (${res.status})`);
      }
      return res;
    },
    onFinish: ({ object: finished }) => {
      if (finished) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: finished.summary, crm: finished }
        ]);
      }
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: `Something went wrong: ${err.message}` }
      ]);
    }
  });

  const latestCrm = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.crm) return m.crm;
    }
    return undefined;
  }, [messages]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;
    const { command, message } = parseSlashCommand(content);
    clear();
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: content }]);
    setInput("");
    submit({ command, message });
  };

  const applyTodayList = async () => {
    const leads = latestCrm?.recommendedLeads ?? [];
    const leadIds = leads.map((row) => row.leadId).filter((id): id is number => typeof id === "number");
    if (!leadIds.length) return;
    await fetch("/api/today-todo/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds })
    });
    await onAppliedAction();
  };

  const queueEnrichment = async () => {
    const leads = latestCrm?.enrichCandidates ?? [];
    const leadIds = leads.map((row) => row.leadId).filter((id): id is number => typeof id === "number");
    if (!leadIds.length) return;
    await fetch("/api/enrichment/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadIds })
    });
    await onAppliedAction();
  };

  const saveSuggestedScript = async () => {
    const top = latestCrm?.scriptsToUse?.[0];
    if (!top?.scriptId) return;
    await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${top.name} (AI draft)`,
        stage: "cold_email",
        tier: 3,
        content: `Draft inspired by script #${top.scriptId}. ${top.reason ?? ""}`
      })
    });
    await onAppliedAction();
  };

  const draft = object;
  const showDraft = isLoading || Boolean(draft?.recommendedLeads?.length || draft?.summary);

  return (
    <aside
      className="card"
      style={dockMode === "right" ? { width: panelWidth } : { width: "100%", height: panelHeight, marginTop: 16 }}
    >
      <div className="between">
        <h3 style={{ margin: 0 }}>AI Assistant</h3>
        <div className="row">
          <button type="button" onClick={() => setDockMode((prev) => (prev === "right" ? "bottom" : "right"))}>
            {dockMode === "right" ? "Bottom Dock" : "Right Sidebar"}
          </button>
        </div>
      </div>
      <div className="row" style={{ margin: "8px 0" }}>
        {dockMode === "right" ? (
          <>
            <label htmlFor="panel-width">Width</label>
            <input
              id="panel-width"
              type="range"
              min={300}
              max={520}
              value={panelWidth}
              onChange={(event) => setPanelWidth(Number(event.target.value))}
            />
          </>
        ) : (
          <>
            <label htmlFor="panel-height">Height</label>
            <input
              id="panel-height"
              type="range"
              min={220}
              max={460}
              value={panelHeight}
              onChange={(event) => setPanelHeight(Number(event.target.value))}
            />
          </>
        )}
      </div>
      <div style={{ maxHeight: dockMode === "right" ? 420 : panelHeight - 120, overflow: "auto", marginBottom: 8 }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              border: "1px solid #e6ebf4",
              borderRadius: 10,
              padding: 8,
              marginBottom: 8,
              background: message.role === "assistant" ? "#f8faff" : "#fff"
            }}
          >
            <strong>{message.role === "assistant" ? "Assistant" : "You"}</strong>
            <p style={{ margin: "6px 0 0" }}>{message.text}</p>
            {message.role === "assistant" && message.crm?.recommendedLeads?.length ? (
              <div style={{ marginTop: 8 }}>
                <strong>Lead preview</strong>
                {message.crm.recommendedLeads.slice(0, 5).map((row) => (
                  <div key={row.leadId} style={{ fontSize: 13 }}>
                    #{row.leadId} {row.companyName} (Tier {row.tier}) {"->"} {row.scriptName}
                  </div>
                ))}
              </div>
            ) : null}
            {message.role === "assistant" && message.crm?.scriptsToUse?.length ? (
              <div style={{ marginTop: 8 }}>
                <strong>Scripts</strong>
                {message.crm.scriptsToUse.slice(0, 3).map((s) => (
                  <div key={s.scriptId} style={{ fontSize: 13 }}>
                    {s.name} (#{s.scriptId})
                  </div>
                ))}
              </div>
            ) : null}
            {message.role === "assistant" && message.crm?.enrichCandidates?.length ? (
              <div style={{ marginTop: 8 }}>
                <strong>Enrichment</strong>
                {message.crm.enrichCandidates.slice(0, 5).map((row) => (
                  <div key={row.leadId} style={{ fontSize: 13 }}>
                    #{row.leadId} {row.companyName} missing {(row.missing ?? []).join(", ")}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {showDraft ? (
          <div
            style={{
              border: "1px dashed #9db7ff",
              borderRadius: 10,
              padding: 8,
              marginBottom: 8,
              background: "#f4f7ff"
            }}
          >
            <strong>{isLoading ? "Streaming plan…" : "Last streamed object"}</strong>
            {draft?.summary ? <p style={{ margin: "6px 0 0", fontSize: 14 }}>{draft.summary}</p> : null}
            {draft?.recommendedLeads?.length ? (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <strong>recommendedLeads</strong> ({draft.recommendedLeads.length})
                {draft.recommendedLeads.slice(0, 5).map((row, i) => (
                  <div key={`${row?.leadId ?? i}`}>
                    #{row?.leadId} {row?.companyName} tier {row?.tier}
                  </div>
                ))}
              </div>
            ) : null}
            {error ? <p style={{ color: "#b42318", marginTop: 6 }}>{error.message}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="row" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={applyTodayList} disabled={!latestCrm?.recommendedLeads?.length}>
          Create today&apos;s list
        </button>
        <button type="button" onClick={queueEnrichment} disabled={!latestCrm?.enrichCandidates?.length}>
          Enrich these leads
        </button>
        <button type="button" onClick={saveSuggestedScript} disabled={!latestCrm?.scriptsToUse?.length}>
          Save script draft
        </button>
      </div>
      <form className="row" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask: /today, /enrich, /scripts"
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
    </aside>
  );
}
