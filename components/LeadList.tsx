"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/apiFetch";
import { fetchJson } from "../lib/fetchJson";
import type { LastContactWindow, LeadListTab, LeadStageFilter } from "../lib/leadsListParams";
import { serializeLeadListQuery } from "../lib/leadsListParams";
import type { Lead, LeadsListApiResponse, LogTouchPayload, Script } from "../lib/types";
import { LeadFilters } from "./LeadFilters";
import { LeadSummaryStats, type LeadSummaryStatsData } from "./LeadSummaryStats";
import { LeadTable } from "./LeadTable";
import { LogTouchModal } from "./LogTouchModal";

const PAGE_SIZE = 25;

type Props = {
  scripts: Script[];
  /** Increment from parent after imports / status changes to refetch the current page. */
  refreshVersion: number;
  onLogTouchSubmit: (payload: LogTouchPayload) => Promise<void>;
  onMarkDead: (leadId: number) => Promise<void>;
  onUnmarkDead?: (leadId: number) => Promise<void>;
  onFetchError?: (message: string) => void;
};

export function LeadList({
  scripts,
  refreshVersion,
  onLogTouchSubmit,
  onMarkDead,
  onUnmarkDead,
  onFetchError
}: Props) {
  const onFetchErrorRef = useRef(onFetchError);
  onFetchErrorRef.current = onFetchError;
  const [tab, setTab] = useState<LeadListTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stages, setStages] = useState<LeadStageFilter[]>([]);
  const [tiers, setTiers] = useState<number[]>([]);
  const [lastContact, setLastContact] = useState<LastContactWindow>("any");
  const [page, setPage] = useState(1);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchLead, setTouchLead] = useState<Lead | null>(null);
  const [pipelineStats, setPipelineStats] = useState<LeadSummaryStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const stagesKey = stages.join(",");
  const tiersKey = tiers.join(",");

  const queryString = useMemo(() => {
    return serializeLeadListQuery({
      tab,
      search: debouncedSearch,
      stages: stages.slice().sort() as LeadStageFilter[],
      tiers: tiers.slice().sort((a, b) => a - b),
      lastContact,
      page,
      pageSize: PAGE_SIZE
    });
  }, [tab, debouncedSearch, stagesKey, tiersKey, lastContact, page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await apiFetch(`/api/leads?${queryString}`);
      const parsed = await fetchJson<LeadsListApiResponse & { error?: string }>(res);
      if (cancelled) return;
      if (!parsed.ok) {
        onFetchErrorRef.current?.(parsed.data.error ?? `Could not load leads (${parsed.status}).`);
        setLeads([]);
        setTotal(0);
      } else {
        setLeads(parsed.data.leads ?? []);
        setTotal(parsed.data.total ?? 0);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString, refreshVersion]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      const res = await apiFetch("/api/leads/summary-stats");
      const parsed = await fetchJson<LeadSummaryStatsData & { error?: string }>(res);
      if (cancelled) return;
      if (!parsed.ok) {
        setStatsError(parsed.data.error ?? `Stats unavailable (${parsed.status})`);
        setPipelineStats(null);
      } else {
        setStatsError(null);
        setPipelineStats({
          todayEligible: parsed.data.todayEligible ?? 0,
          highTierMissingContact: parsed.data.highTierMissingContact ?? 0,
          dead: parsed.data.dead ?? 0
        });
      }
      setStatsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const handleTab = (t: LeadListTab) => {
    setTab(t);
    setPage(1);
  };

  const handleToggleStage = (stage: LeadStageFilter) => {
    setStages((prev) => {
      const has = prev.includes(stage);
      const next = has ? prev.filter((x) => x !== stage) : [...prev, stage];
      return next.sort();
    });
    setPage(1);
  };

  const handleToggleTier = (n: number) => {
    setTiers((prev) => {
      const has = prev.includes(n);
      const next = has ? prev.filter((x) => x !== n) : [...prev, n];
      return next.sort((a, b) => a - b);
    });
    setPage(1);
  };

  const handleLastContact = (v: LastContactWindow) => {
    setLastContact(v);
    setPage(1);
  };

  return (
    <>
      <LeadSummaryStats stats={pipelineStats} loading={statsLoading} error={statsError} />
      <div className="card">
      <h3 style={{ marginTop: 0 }}>Leads</h3>
      <LeadFilters
        tab={tab}
        onTab={handleTab}
        search={search}
        onSearch={setSearch}
        stages={stages}
        onToggleStage={handleToggleStage}
        tiers={tiers}
        onToggleTier={handleToggleTier}
        lastContact={lastContact}
        onLastContact={handleLastContact}
      />
      <LeadTable
        leads={leads}
        loading={loading}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onLogTouch={setTouchLead}
        onMarkDead={onMarkDead}
        onUnmarkDead={onUnmarkDead}
      />
      <LogTouchModal
        lead={touchLead}
        scripts={scripts}
        open={touchLead !== null}
        onClose={() => setTouchLead(null)}
        onSubmit={onLogTouchSubmit}
      />
    </div>
    </>
  );
}
