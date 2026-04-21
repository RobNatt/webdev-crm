import { createGroq } from "@ai-sdk/groq";
import { streamObject } from "ai";
import { loadAiContext } from "../../../../lib/aiContext";
import { crmAssistantResultSchema } from "../../../../lib/crmAiSchema";

export const maxDuration = 60;

const SYSTEM = `You are CRM Copilot for a freelance web-dev agency. You output ONE JSON object that matches the schema (no markdown fences, no extra prose outside the JSON stream).

Hard rules:
- Daily outreach cap: recommend at most "settings.maxDailyOutreach" leads in recommendedLeads (also clamp between 20 and 30).
- Never recommend a lead with totalTouches >= 3 or status dead, booked_call, or no_further_follow_up.
- Prefer lower tier numbers first (tier 1 before tier 5).
- Pick scripts where script.tier matches lead.tier and script.type aligns with lead.nextAction (follow_up -> follow_up script).
- enrichCandidates: only leads with tier >= 4 AND (missing email or missing phone). Empty array if none.
- tierAssignments: only when user asks to (re)tier leads; use website strength signals.

Commands (optional, echoed in user message):
- /today — focus on recommendedLeads + scriptsToUse
- /enrich — focus on enrichCandidates
- /scripts — focus on scriptsToUse and summary

Always set version: 1 and fill "summary" with one short paragraph.`;

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing GROQ_API_KEY" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body: { command?: string | null; message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let command = body.command != null ? String(body.command) : null;
  if (!command && message.startsWith("/")) {
    command = message.split(/\s+/)[0] ?? null;
  }

  let context: Awaited<ReturnType<typeof loadAiContext>>;
  try {
    context = await loadAiContext();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return new Response(JSON.stringify({ error: message, hint: "Run: npx prisma migrate deploy" }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const groq = createGroq({ apiKey });
  const model = groq("llama-3.3-70b-versatile");

  const result = streamObject({
    model,
    schema: crmAssistantResultSchema,
    schemaName: "CrmAssistantResult",
    schemaDescription: "Structured CRM planning JSON for outreach, scripts, enrichment, tiering",
    system: SYSTEM,
    prompt: `Command: ${command ?? "none"}
User message: ${message}

Database context (JSON):
${JSON.stringify(context)}`,
    providerOptions: {
      groq: {
        structuredOutputs: true
      }
    }
  });

  return result.toTextStreamResponse();
}
