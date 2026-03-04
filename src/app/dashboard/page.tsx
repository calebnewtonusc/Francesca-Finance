"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "@/components/nav";
import NetWorthChart from "@/components/dashboard/NetWorthChart";
import AccountCard from "@/components/dashboard/AccountCard";
import ContributionPlan from "@/components/dashboard/ContributionPlan";
import RetirementCard from "@/components/dashboard/RetirementCard";
import AgentPanel from "@/components/dashboard/AgentPanel";
import AlertBanner from "@/components/dashboard/AlertBanner";
import { DEFAULT_PROFILE } from "@/lib/types";
import { FinancialProfile, ProjectionYear, RetirementSummary, MonteCarloResult, MonthlyAllocation, AppAlert, Scenario, ProjectionMode } from "@/lib/types";
import { fmtCompact, fmt$ } from "@/lib/format";

// Icons
const I = {
  trad: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></svg>,
  roth: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  broker: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>,
  hysa: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  mega: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
};

function ScenarioToggle({ scenario, mode, showReal, onScenario, onMode, onReal }:
  { scenario: Scenario; mode: ProjectionMode; showReal: boolean; onScenario: (s: Scenario) => void; onMode: (m: ProjectionMode) => void; onReal: (r: boolean) => void }
) {
  function Seg({ options, active, onChange }: { options: { value: string; label: string }[]; active: string; onChange: (v: string) => void }) {
    return (
      <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 8, padding: 2, gap: 2 }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "4px 10px", borderRadius: 6, border: "none",
              background: active === o.value ? "var(--surface-3)" : "transparent",
              color: active === o.value ? "var(--label)" : "var(--label-3)",
              fontSize: 12, fontWeight: active === o.value ? 600 : 400,
              fontFamily: "var(--font)", cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <Seg options={[{value:"deterministic",label:"Deterministic"},{value:"monte_carlo",label:"Monte Carlo"}]} active={mode} onChange={(v) => onMode(v as ProjectionMode)} />
      {mode === "monte_carlo" && <Seg options={[{value:"conservative",label:"Conservative"},{value:"baseline",label:"Baseline"},{value:"aggressive",label:"Aggressive"}]} active={scenario} onChange={(v) => onScenario(v as Scenario)} />}
      <Seg options={[{value:"real",label:"Real"},{value:"nominal",label:"Nominal"}]} active={showReal ? "real" : "nominal"} onChange={(v) => onReal(v === "real")} />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 22) return "Good evening";
  return "Hey";
}

function loadProfile(): FinancialProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const s = localStorage.getItem("francesca_profile");
    return s ? JSON.parse(s) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export default function DashboardPage() {
  const [profile] = useState<FinancialProfile>(loadProfile);
  const [projection, setProjection] = useState<ProjectionYear[]>([]);
  const [retirement, setRetirement] = useState<RetirementSummary | null>(null);
  const [monteCarlo, setMonteCarlo] = useState<MonteCarloResult | null>(null);
  const [allocation, setAllocation] = useState<MonthlyAllocation | null>(null);
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [mode, setMode] = useState<ProjectionMode>("deterministic");
  const [scenario, setScenario] = useState<Scenario>("baseline");
  const [showReal, setShowReal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, mode, scenario }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setAllocation(data.allocation);
      setAlerts(data.alerts ?? []);
      if (mode === "monte_carlo") {
        setMonteCarlo(data.monteCarlo);
      } else {
        setProjection(data.projection ?? []);
        setRetirement(data.retirement ?? null);
        setMonteCarlo(null);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [profile, mode, scenario]);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  const now = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const totalNow = profile.balance401k + profile.balanceMegaBackdoor + profile.balanceRothIRA + profile.balanceBrokerage + profile.balanceHYSA + profile.rsuValue;

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "68px 24px 40px" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <p className="t-footnote" style={{ color: "var(--label-3)", marginBottom: 4 }}>{now}</p>
          <h1 className="t-large-title" style={{ color: "var(--label)" }}>{getGreeting()}, Francesca.</h1>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="fade-up delay-1" style={{ marginBottom: 20 }}>
            <AlertBanner alerts={alerts} />
          </div>
        )}

        {/* Net worth hero */}
        <div className="glass fade-up delay-1" style={{ padding: "24px 24px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p className="t-caption1" style={{ color: "var(--label-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total Net Worth</p>
              <p style={{ fontSize: 44, fontWeight: 700, color: "var(--label)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                {fmtCompact(totalNow)}
              </p>
              <p className="t-footnote" style={{ color: "var(--label-3)", marginTop: 6 }}>
                Current · projection at 59.5:{" "}
                <span style={{ color: "var(--green)" }}>
                  {retirement ? fmtCompact(retirement.afterTaxTotal) : "—"}
                </span>
                {" "}after tax
              </p>
            </div>
            <ScenarioToggle scenario={scenario} mode={mode} showReal={showReal} onScenario={setScenario} onMode={setMode} onReal={setShowReal} />
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 220, marginTop: 16, borderRadius: 10 }} />
          ) : fetchError ? (
            <div style={{ height: 220, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="t-footnote" style={{ color: "var(--label-3)" }}>Unable to load projection — <button onClick={fetchForecast} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13 }}>Retry</button></p>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <NetWorthChart projection={projection} monteCarlo={monteCarlo} mode={mode} showReal={showReal} startAge={profile.age} />
            </div>
          )}
        </div>

        {/* Account cards */}
        <div
          className="fade-up delay-2"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}
        >
          <AccountCard label="401(k) Traditional" balance={profile.balance401k} type="tax-deferred" icon={I.trad} />
          <AccountCard label="Mega Backdoor Roth" balance={profile.balanceMegaBackdoor} type="tax-free" icon={I.mega} />
          <AccountCard label="Roth IRA" balance={profile.balanceRothIRA} type="tax-free" icon={I.roth} />
          <AccountCard label="Brokerage" balance={profile.balanceBrokerage} type="taxable" icon={I.broker} />
          <AccountCard label="HYSA" balance={profile.balanceHYSA} type="cash" icon={I.hysa} />
        </div>

        {/* Monte Carlo percentile table */}
        {mode === "monte_carlo" && monteCarlo && (
          <div className="glass fade-up delay-2" style={{ padding: "18px 20px", marginBottom: 16 }}>
            <p className="t-headline" style={{ color: "var(--label)", marginBottom: 14 }}>At 59.5 — Probability Range (real $)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0 }}>
              {(["p10","p25","p50","p75","p90"] as const).map((k, i) => (
                <div key={k} style={{ padding: "10px 0", borderRight: i < 4 ? "0.5px solid var(--separator)" : "none", textAlign: "center" }}>
                  <p className="t-caption2" style={{ color: "var(--label-3)", marginBottom: 4 }}>{k.toUpperCase()}</p>
                  <p className="t-subhead" style={{ color: k === "p50" ? "var(--green)" : "var(--label)", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(monteCarlo[k])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom grid */}
        <div className="fade-up delay-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginBottom: 16 }}>
          {allocation && <ContributionPlan allocation={allocation} />}
          {retirement && <RetirementCard summary={retirement} retirementAge={profile.retirementAge} />}
        </div>

        {/* Agent */}
        <div className="fade-up delay-4">
          <AgentPanel profile={profile} />
        </div>

        {/* HYSA progress */}
        {profile.balanceHYSA < profile.emergencyFundTarget && (
          <div className="glass fade-up delay-5" style={{ marginTop: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p className="t-footnote" style={{ color: "var(--label-2)" }}>Emergency Fund</p>
              <p className="t-footnote" style={{ color: "var(--label-3)" }}>
                {fmt$(profile.balanceHYSA)} / {fmt$(profile.emergencyFundTarget)}
              </p>
            </div>
            <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: "var(--green)",
                width: `${Math.min(100, (profile.balanceHYSA / profile.emergencyFundTarget) * 100)}%`,
                transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
