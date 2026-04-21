/**
 * Shared lead-list filters (URL ↔ state). Safe to import from client components.
 * Server maps this shape to Prisma via `prismaWhereFromLeadListQuery`.
 */

export type LeadListTab = "all" | "today";

/** UI stage chips → resolved on the server to Prisma conditions. */
export type LeadStageFilter = "new" | "contacted" | "replied" | "booked" | "dead";

export type LastContactWindow = "any" | "none" | "over7" | "within7";

export type LeadsListQueryState = {
  tab: LeadListTab;
  search: string;
  stages: LeadStageFilter[];
  tiers: number[];
  lastContact: LastContactWindow;
  page: number;
  pageSize: number;
};

const DEFAULTS: LeadsListQueryState = {
  tab: "all",
  search: "",
  stages: [],
  tiers: [],
  lastContact: "any",
  page: 1,
  pageSize: 25
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function parseLeadListQuery(sp: URLSearchParams): LeadsListQueryState {
  const tab = sp.get("tab") === "today" ? "today" : "all";
  const search = (sp.get("search") ?? "").trim().slice(0, 200);
  const stages = (sp.get("stages") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is LeadStageFilter =>
      s === "new" || s === "contacted" || s === "replied" || s === "booked" || s === "dead"
    );
  const tiers = (sp.get("tiers") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => n >= 1 && n <= 5);
  const lc = sp.get("lastContact");
  const lastContact: LastContactWindow =
    lc === "none" || lc === "over7" || lc === "within7" ? lc : "any";
  const page = clamp(Number.parseInt(sp.get("page") ?? "1", 10) || 1, 1, 50_000);
  const pageSize = clamp(Number.parseInt(sp.get("pageSize") ?? String(DEFAULTS.pageSize), 10) || DEFAULTS.pageSize, 1, 100);
  return { tab, search, stages, tiers, lastContact, page, pageSize };
}

export function serializeLeadListQuery(q: LeadsListQueryState): string {
  const p = new URLSearchParams();
  if (q.tab === "today") p.set("tab", "today");
  if (q.search) p.set("search", q.search);
  if (q.stages.length) p.set("stages", q.stages.join(","));
  if (q.tiers.length) p.set("tiers", q.tiers.join(","));
  if (q.lastContact !== "any") p.set("lastContact", q.lastContact);
  if (q.page !== 1) p.set("page", String(q.page));
  if (q.pageSize !== DEFAULTS.pageSize) p.set("pageSize", String(q.pageSize));
  return p.toString();
}
