import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { calcMonthlyAllocation } from "@/lib/finance-engine";
import { FinancialProfile } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, profile } = await req.json() as { question: string; profile: FinancialProfile };
  if (!question || !profile) return NextResponse.json({ error: "question and profile required" }, { status: 400 });

  const a = calcMonthlyAllocation(profile);

  const system = `You are Francesca's personal finance assistant. You explain her specific allocation plan clearly and concisely. You NEVER invent numbers — all figures come from the engine below.

Monthly allocation:
• Gross: $${a.gross.toFixed(0)}/mo
• Pre-tax 401(k): $${a.pretax401k.toFixed(0)} (employer adds $${a.employerMatch.toFixed(0)})
• Mega Backdoor Roth: $${a.megaBackdoor.toFixed(0)}
• Roth IRA: $${a.rothIRA.toFixed(0)}
• Brokerage: $${a.brokerage.toFixed(0)}
• HYSA: $${a.hysa.toFixed(0)}
• Federal tax: $${a.federalTax.toFixed(0)} | CA tax: $${a.caTax.toFixed(0)}
• SS: $${a.ssTax.toFixed(0)} | Medicare: $${a.medicareTax.toFixed(0)} | CA SDI: $${a.caSDI.toFixed(0)}
• Health: $${a.healthPremium.toFixed(0)} | HSA: $${a.hsaMonthly.toFixed(0)}
• Expenses: $${a.expenses.toFixed(0)} | Investable: $${a.investableCash.toFixed(0)}

Be brief and factual. No product recommendations.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: question }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";
    return NextResponse.json({ answer: text });
  } catch {
    return NextResponse.json({ error: "Agent unavailable" }, { status: 502 });
  }
}
