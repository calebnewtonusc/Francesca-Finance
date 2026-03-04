"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PROFILE, FinancialProfile } from "@/lib/types";

const STEPS = ["Income", "Expenses", "Balances", "Done"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 3, borderRadius: 2,
            width: i < current ? 24 : i === current ? 32 : 16,
            background: i <= current ? "var(--blue)" : "var(--surface-3)",
            transition: "width 0.3s, background 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="t-footnote" style={{ color: "var(--label-2)", display: "block", marginBottom: 6 }}>{children}</label>;
}

function TextInput({ label, value, onChange, type = "number", prefix, suffix, placeholder }: {
  label: string; value: number | string; onChange: (v: number) => void;
  type?: string; prefix?: string; suffix?: string; placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {prefix && <span className="t-subhead" style={{ color: "var(--label-3)" }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1, padding: "12px 14px",
            background: "var(--surface-1)", border: "1px solid var(--separator)",
            borderRadius: 10, color: "var(--label)", fontSize: 16,
            fontFamily: "var(--font)", outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--separator)")}
        />
        {suffix && <span className="t-subhead" style={{ color: "var(--label-3)" }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [p, setP] = useState<FinancialProfile>(DEFAULT_PROFILE);
  const router = useRouter();

  function update(key: keyof FinancialProfile, val: number) {
    setP((prev) => ({ ...prev, [key]: val }));
  }

  function finish() {
    if (typeof window !== "undefined") localStorage.setItem("francesca_profile", JSON.stringify(p));
    router.push("/dashboard");
  }

  const canNext = step < STEPS.length - 1;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div
        aria-hidden
        style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(10,132,255,0.05) 0%, transparent 70%)" }}
      />

      <div className="fade-up" style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ marginBottom: 32 }}>
          <StepIndicator current={step} total={STEPS.length - 1} />
          <h1 className="t-title1" style={{ color: "var(--label)", marginTop: 20 }}>
            {step === 0 && "Tell me about your income"}
            {step === 1 && "Monthly expenses"}
            {step === 2 && "Starting balances"}
            {step === 3 && "You're all set"}
          </h1>
          <p className="t-subhead" style={{ color: "var(--label-3)", marginTop: 6 }}>
            {step === 0 && "Used to calculate taxes and contributions"}
            {step === 1 && "Any change instantly recalculates your plan"}
            {step === 2 && "Where you're starting from today"}
            {step === 3 && "Your plan is ready"}
          </p>
        </div>

        <div className="glass" style={{ padding: "24px 24px", marginBottom: 20 }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TextInput label="Base Salary" value={p.baseSalary} onChange={(v) => update("baseSalary", v)} prefix="$" placeholder="120000" />
              <TextInput label="Health Insurance Premium (monthly)" value={p.healthPremium} onChange={(v) => update("healthPremium", v)} prefix="$" placeholder="200" />
              <TextInput label="HSA Contribution (monthly)" value={p.hsaMonthly} onChange={(v) => update("hsaMonthly", v)} prefix="$" placeholder="0" />
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TextInput label="Rent (monthly)" value={p.rent} onChange={(v) => update("rent", v)} prefix="$" placeholder="2500" />
              <TextInput label="Utilities (monthly)" value={p.utilities} onChange={(v) => update("utilities", v)} prefix="$" placeholder="150" />
              <TextInput label="Other Expenses (monthly)" value={p.otherExpenses} onChange={(v) => update("otherExpenses", v)} prefix="$" placeholder="800" />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <TextInput label="401(k) Balance" value={p.balance401k} onChange={(v) => update("balance401k", v)} prefix="$" placeholder="0" />
              <TextInput label="Roth IRA Balance" value={p.balanceRothIRA} onChange={(v) => update("balanceRothIRA", v)} prefix="$" placeholder="35000" />
              <TextInput label="Brokerage Balance" value={p.balanceBrokerage} onChange={(v) => update("balanceBrokerage", v)} prefix="$" placeholder="60000" />
              <TextInput label="HYSA Balance" value={p.balanceHYSA} onChange={(v) => update("balanceHYSA", v)} prefix="$" placeholder="5000" />
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--green-dim)", border: "1px solid rgba(48,209,88,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="t-title3" style={{ color: "var(--label)" }}>Setup complete</p>
              <p className="t-subhead" style={{ color: "var(--label-3)", marginTop: 6 }}>You can update everything in Settings at any time.</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && step < 3 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                flex: 1, padding: "14px", borderRadius: 12,
                background: "var(--surface-1)", color: "var(--label-2)",
                border: "1px solid var(--separator)", fontSize: 16,
                fontFamily: "var(--font)", cursor: "pointer",
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => canNext ? setStep((s) => s + 1) : finish()}
            style={{
              flex: 2, padding: "14px", borderRadius: 12,
              background: step === 3 ? "var(--green)" : "var(--blue)",
              color: "#fff", border: "none", fontSize: 16, fontWeight: 600,
              fontFamily: "var(--font)", cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {step === 3 ? "Go to Dashboard" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}
