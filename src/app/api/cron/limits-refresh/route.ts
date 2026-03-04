import { NextResponse } from "next/server";

// Vercel Cron: runs Jan 1 annually
// In production: pull latest IRS limits and update DB — flagged for human review before applying
export async function GET() {
  // TODO: fetch from IRS RSS / FTB pages, parse, write to DB with pending_review=true
  // For now, log a reminder
  console.log("[limits-refresh] Annual IRS limits review triggered — verify manually at irs.gov/newsroom");
  return NextResponse.json({ ok: true, message: "Limits refresh queued for human review" });
}
