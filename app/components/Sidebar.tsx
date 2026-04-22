"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiFetch";
import { fetchJson } from "../../lib/fetchJson";
import styles from "./Sidebar.module.css";

type Stats = {
  todayEligible: number;
  highTierMissingContact: number;
  dead: number;
};

export function Sidebar() {
  const pathname = usePathname();
  const onLeadDetail = pathname?.startsWith("/leads/") ?? false;
  const dashActive = pathname === "/" || pathname === "";
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiFetch("/api/leads/summary-stats");
      const parsed = await fetchJson<Stats & { error?: string }>(res);
      if (cancelled || !parsed.ok) return;
      setStats({
        todayEligible: parsed.data.todayEligible ?? 0,
        highTierMissingContact: parsed.data.highTierMissingContact ?? 0,
        dead: parsed.data.dead ?? 0
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className={styles.sidebar} aria-label="Primary navigation">
      <div className={styles.brand}>
        <div className={styles.wordmark}>Webdev CRM</div>
        <div className={styles.tagline}>Freelance outreach</div>
      </div>
      <nav className={styles.nav}>
        <div className={styles.navSectionLabel}>Pipeline</div>
        <Link href="/" className={dashActive && !onLeadDetail ? styles.navLinkActive : styles.navLink}>
          <span>Dashboard</span>
          {stats ? <span className={styles.navCount}>{stats.todayEligible}</span> : <span className={styles.navCount}>—</span>}
        </Link>
        {onLeadDetail ? <div className={styles.navHint}>Lead record · use top bar to return</div> : null}
      </nav>
      <div className={styles.footer}>
        <div className={styles.avatar} aria-hidden>
          WC
        </div>
        <div>
          <div className={styles.footerName}>Workspace</div>
          <div className={styles.footerRole}>Operator</div>
        </div>
      </div>
    </aside>
  );
}
