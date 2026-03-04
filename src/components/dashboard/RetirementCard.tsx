import { RetirementSummary } from "@/lib/types";
import { fmt$, fmtCompact } from "@/lib/format";

interface Props {
  summary: RetirementSummary;
  retirementAge: number;
}

export default function RetirementCard({ summary: s, retirementAge }: Props) {
  const rows = [
    { label: "401(k)", value: s.by401k, note: `−${fmt$(s.taxDue401k)} est. tax`, color: "var(--blue)" },
    { label: "Mega Backdoor Roth", value: s.byMegaBackdoor, note: "Tax-free", color: "var(--purple)" },
    { label: "Roth IRA", value: s.byRothIRA, note: "Tax-free", color: "var(--green)" },
    { label: "Brokerage", value: s.byBrokerage, note: `−${fmt$(s.taxDueBrokerage)} est. LTCG`, color: "var(--orange)" },
    { label: "HYSA", value: s.byHYSA, note: "Liquid", color: "var(--label-2)" },
    { label: "RSU (hold)", value: s.byRSU, note: "Mark-to-market", color: "var(--yellow, #ffd60a)" },
  ].filter((r) => r.value > 0);

  return (
    <div className="glass" style={{ padding: "20px 20px" }}>
      {/* Hero */}
      <div style={{ marginBottom: 20, paddingBottom: 18, borderBottom: "0.5px solid var(--separator)" }}>
        <p className="t-caption1" style={{ color: "var(--label-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          At age {retirementAge}
        </p>
        <p style={{ fontSize: 38, fontWeight: 700, color: "var(--green)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
          {fmtCompact(s.afterTaxTotal)}
        </p>
        <p className="t-footnote" style={{ color: "var(--label-3)", marginTop: 4 }}>
          After estimated taxes · real 2026 dollars
        </p>

        {/* 4% rule */}
        <div style={{ marginTop: 14, display: "flex", gap: 24 }}>
          <div>
            <p className="t-caption2" style={{ color: "var(--label-3)" }}>Safe withdrawal (4%)</p>
            <p className="t-headline" style={{ color: "var(--label)", fontVariantNumeric: "tabular-nums" }}>
              {fmt$(s.safeWithdrawalMonthly)}<span className="t-footnote" style={{ color: "var(--label-3)" }}>/mo</span>
            </p>
          </div>
          <div>
            <p className="t-caption2" style={{ color: "var(--label-3)" }}>Annual</p>
            <p className="t-headline" style={{ color: "var(--label)", fontVariantNumeric: "tabular-nums" }}>
              {fmtCompact(s.safeWithdrawalAnnual)}
            </p>
          </div>
        </div>
      </div>

      {/* By account */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 0",
              borderBottom: i < rows.length - 1 ? "0.5px solid var(--separator)" : "none",
            }}
          >
            <div style={{ width: 3, height: 28, borderRadius: 2, background: r.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p className="t-footnote" style={{ color: "var(--label-2)" }}>{r.label}</p>
              <p className="t-caption2" style={{ color: "var(--label-3)" }}>{r.note}</p>
            </div>
            <p className="t-footnote" style={{ color: "var(--label)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
              {fmtCompact(r.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
