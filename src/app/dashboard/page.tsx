"use client";

import { useState, useEffect, useCallback } from "react";
import Nav from "@/components/nav";
import NetWorthChart from "@/components/dashboard/NetWorthChart";
import ContributionPlan from "@/components/dashboard/ContributionPlan";
import RetirementCard from "@/components/dashboard/RetirementCard";
import AgentPanel from "@/components/dashboard/AgentPanel";
import AlertBanner from "@/components/dashboard/AlertBanner";
import { DEFAULT_PROFILE } from "@/lib/types";
import { FinancialProfile, ProjectionYear, RetirementSummary, MonteCarloResult, MonthlyAllocation, AppAlert, Scenario, ProjectionMode } from "@/lib/types";
import { fmtCompact, fmt$ } from "@/lib/format";

function ScenarioToggle({ scenario, mode, showReal, onScenario, onMode, onReal }:
  { scenario: Scenario; mode: ProjectionMode; showReal: boolean; onScenario: (s: Scenario) => void; onMode: (m: ProjectionMode) => void; onReal: (r: boolean) => void }
) {
  function Seg({ options, active, onChange }: { options: { value: string; label: string }[]; active: string; onChange: (v: string) => void }) {
    return (
      <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 7, padding: 2, gap: 2 }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "3px 9px", borderRadius: 5, border: "none",
              background: active === o.value ? "var(--surface-3)" : "transparent",
              color: active === o.value ? "var(--label-2)" : "var(--label-3)",
              fontSize: 11, fontWeight: active === o.value ? 500 : 400,
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
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
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
  const [profile, setProfile] = useState<FinancialProfile>(loadProfile);

  // Sync from cloud on mount — overrides localStorage if Supabase is configured
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
          localStorage.setItem("francesca_profile", JSON.stringify(data.profile));
        }
      })
      .catch(() => {});
  }, []);
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

  const accounts = [
    { label: "401(k)", value: profile.balance401k },
    { label: "Mega Backdoor", value: profile.balanceMegaBackdoor },
    { label: "Roth IRA", value: profile.balanceRothIRA },
    { label: "Brokerage", value: profile.balanceBrokerage },
    { label: "HYSA", value: profile.balanceHYSA },
  ];

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "68px 24px 40px" }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 24 }}>
          <p className="t-footnote" style={{ color: "var(--label-3)", marginBottom: 4 }}>{now}</p>
          <h1 className="t-large-title" style={{ color: "var(--label)" }}>{getGreeting()}, Francesca.</h1>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="fade-up delay-1" style={{ marginBottom: 16 }}>
            <AlertBanner alerts={alerts} />
          </div>
        )}

        {/* ─── Net Worth Hero ─── */}
        <div className="glass fade-up delay-1" style={{ padding: "24px 24px 0", marginBottom: 12 }}>

          {/* Primary number */}
          <div style={{ marginBottom: 16 }}>
            <p className="t-caption1" style={{ color: "var(--label-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Total Net Worth</p>
            <p style={{ fontSize: 52, fontWeight: 700, color: "var(--label)", fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-1px" }}>
              {fmtCompact(totalNow)}
            </p>
            <p className="t-footnote" style={{ color: "var(--label-3)", marginTop: 8 }}>
              Projected at {profile.retirementAge}:{" "}
              <span style={{ color: loading ? "var(--label-3)" : "var(--green)" }}>
                {retirement ? fmtCompact(retirement.afterTaxTotal) : "—"}
              </span>
              {" "}after tax · real dollars
            </p>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
          ) : fetchError ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="t-footnote" style={{ color: "var(--label-3)" }}>
                Unable to load —{" "}
                <button onClick={fetchForecast} style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontFamily: "var(--font)", fontSize: 13 }}>Retry</button>
              </p>
            </div>
          ) : (
            <NetWorthChart projection={projection} monteCarlo={monteCarlo} mode={mode} showReal={showReal} startAge={profile.age} />
          )}

          {/* Scenario controls — below chart, subordinate */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0 14px" }}>
            <ScenarioToggle scenario={scenario} mode={mode} showReal={showReal} onScenario={setScenario} onMode={setMode} onReal={setShowReal} />
          </div>

          {/* Account balance chips — inside hero, separated */}
          <div style={{ borderTop: "0.5px solid var(--separator)", overflowX: "auto", marginLeft: -24, marginRight: -24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(90px, 1fr))", minWidth: 450, paddingLeft: 24, paddingRight: 24 }}>
              {accounts.map((a, i) => (
                <div
                  key={a.label}
                  style={{
                    padding: "14px 0 16px",
                    paddingLeft: i > 0 ? 14 : 0,
                    borderLeft: i > 0 ? "0.5px solid var(--separator)" : "none",
                  }}
                >
                  <p className="t-caption2" style={{ color: "var(--label-3)", marginBottom: 4 }}>{a.label}</p>
                  <p className="t-subhead" style={{ color: "var(--label)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmt$(a.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monte Carlo percentile table */}
        {mode === "monte_carlo" && monteCarlo && (
          <div className="glass fade-up delay-2" style={{ padding: "18px 20px", marginBottom: 12 }}>
            <p className="t-footnote" style={{ color: "var(--label-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>At {profile.retirementAge} — Probability Range</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 0 }}>
              {(["p10","p25","p50","p75","p90"] as const).map((k, i) => (
                <div key={k} style={{ padding: "0", paddingLeft: i > 0 ? 14 : 0, borderLeft: i > 0 ? "0.5px solid var(--separator)" : "none" }}>
                  <p className="t-caption2" style={{ color: "var(--label-3)", marginBottom: 4 }}>{k.toUpperCase()}</p>
                  <p className="t-subhead" style={{ color: k === "p50" ? "var(--green)" : "var(--label)", fontVariantNumeric: "tabular-nums" }}>{fmtCompact(monteCarlo[k])}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Cards Row ─── */}
        <div className="fade-up delay-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 12 }}>
          {allocation && <ContributionPlan allocation={allocation} />}
          {retirement && <RetirementCard summary={retirement} retirementAge={profile.retirementAge} />}
        </div>

        {/* HYSA progress — only when below target */}
        {profile.balanceHYSA < profile.emergencyFundTarget && (
          <div className="glass fade-up delay-3" style={{ marginBottom: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <p className="t-footnote" style={{ color: "var(--label-2)" }}>Emergency Fund</p>
              <p className="t-footnote" style={{ color: "var(--label-3)" }}>
                {fmt$(profile.balanceHYSA)} / {fmt$(profile.emergencyFundTarget)}
              </p>
            </div>
            <div style={{ height: 3, background: "var(--surface-2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: "var(--green)",
                width: `${Math.min(100, (profile.balanceHYSA / profile.emergencyFundTarget) * 100)}%`,
                transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              }} />
            </div>
          </div>
        )}

        {/* Agent */}
        <div className="fade-up delay-3">
          <AgentPanel profile={profile} />
        </div>

      </main>
    </>
  );
}
