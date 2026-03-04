# Francesca Finance

A personal financial projection tool built for one person — you. It models your net worth from today to retirement, runs Monte Carlo simulations, and answers your financial questions with an AI agent that knows your exact numbers.

**Stack:** Next.js 15 · TypeScript · Supabase (optional) · Plaid (optional) · Claude AI

---

## What it does

### Dashboard
- **Net worth hero** — live total across 401(k), Mega Backdoor Roth, Roth IRA, brokerage, HYSA, and RSU holding
- **Projection chart** — year-by-year compounding from today to your target retirement age
- **Real vs. nominal toggle** — inflation-adjusted vs. raw dollar view
- **Retirement card** — 4% safe withdrawal rate in today's dollars, after-tax breakdown by account type
- **Emergency fund tracker** — progress bar toward your HYSA target (default $30,000)
- **AI agent panel** — ask plain-English questions about your allocation

### Projection engine
- Maxes all tax-advantaged accounts first, in priority order:
  1. 401(k) traditional (pre-tax) up to the annual IRS elective deferral limit
  2. Employer match (100% up to 50% of the employee deferral limit)
  3. Mega Backdoor Roth (after-tax 401k → in-service Roth conversion) up to remaining 415(c) space
  4. Roth IRA direct (income-tested against MAGI; phases out above the annual threshold)
  5. Brokerage (taxable) with remaining investable cash
  6. HYSA funded proportionally (80% brokerage / 20% HYSA) until HYSA reaches its emergency fund target
- Salary grows at a configurable annual raise rate plus promotion bumps every N years
- All limits and brackets use **2026 IRS Rev. Proc. 2025-22** and **2026 CA FTB Schedule X**

### Tax engine

> **Important:** The tax engine is calibrated for **California (San Jose area), single filing status, no dependents.** Federal brackets apply to everyone, but the CA state tax calculation will be wrong if you live outside California or have a different filing status.

- **Federal:** 2026 single-filer brackets (IRS Rev. Proc. 2025-22) with standard deduction
- **California:** 2026 Schedule X single-filer brackets with CA standard deduction ($5,706)
- **Social Security:** 6.2% up to $176,100 wage base (2026)
- **Medicare:** 1.45% on all wages + 0.9% additional above $200,000 MAGI
- **CA SDI:** 1.1% on all wages (2026, no wage ceiling)
- HSA contributions reduce **federal** taxable income but are **NOT deductible for California** (correctly handled)

### Monte Carlo simulation
- 1,000 lognormal return paths per scenario
- RSU modeled with independent draw at 2× market volatility
- Scenarios: Conservative (6% return / 12% vol), Baseline (10% / 15%), Aggressive (14% / 20%)
- Outputs P10 / P25 / P50 / P75 / P90 percentile bands

### Plaid balance sync (optional)
- Designed to connect **Wells Fargo** (checking), **E-Trade** (brokerage + HYSA), and **Fidelity** (IRA)
- Balances-only sync when you open the app (no transaction history in V1)
- Access tokens stored AES-256-GCM encrypted in Supabase

### AI agent
- Powered by Claude Sonnet (Anthropic API)
- Only reads from the projection engine — never invents numbers
- Answers questions like "What should I contribute each month?" or "Why Mega Backdoor over brokerage?"

---

## Setting up your own deployment

### What you need

| Thing | Cost | Required? |
|---|---|---|
| [Vercel](https://vercel.com) account | Free | Yes |
| [Supabase](https://supabase.com) account | Free tier | Recommended |
| [Anthropic API key](https://console.anthropic.com) | Pay-per-use (very cheap) | For AI agent |
| [Plaid](https://plaid.com) account | Free sandbox | For live balances |

---

### Step 1 — Fork the repo

1. On the GitHub repo page, click **Fork** (top right)
2. Name it anything you want

---

### Step 2 — Set up Supabase (recommended)

Without Supabase, your profile saves to browser localStorage only — it resets if you clear site data or switch devices. Supabase gives you persistent cloud storage.

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Name it anything, pick a region near you, set a database password
3. Once created, go to **SQL Editor** and run this:

```sql
create table user_profiles (
  id text primary key,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row-level security (single-user app; only the service role can access)
alter table user_profiles enable row level security;
create policy "service_role_only" on user_profiles
  using (false) with check (false);
```

4. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** (click to reveal) → `SUPABASE_SERVICE_ROLE_KEY`

> Keep the service_role key secret — it bypasses row-level security.

---

### Step 3 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your forked GitHub repo (Next.js is auto-detected)
3. Leave build settings as defaults
4. **Before clicking Deploy**, add your environment variables (Step 4 below)
5. Click **Deploy**

---

### Step 4 — Set environment variables

In Vercel → your project → **Settings → Environment Variables**:

#### Required

| Variable | How to get it |
|---|---|
| `JWT_SECRET` | Run `openssl rand -base64 32` in your terminal — any random 32+ character string |
| `FRANCESCA_PASSWORD_HASH` | See "Setting your password" below |

#### For the AI agent (recommended)

| Variable | How to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys → Create |

#### For Supabase cloud persistence (recommended)

| Variable | Value source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (keep secret!) |

#### For Plaid live balance sync (optional)

| Variable | How to get it |
|---|---|
| `PLAID_CLIENT_ID` | [dashboard.plaid.com](https://dashboard.plaid.com) → Team Settings → Keys |
| `PLAID_SECRET` | Same page — use the **Sandbox** key to start |
| `PLAID_ENV` | `sandbox` to test with fake credentials, `production` for real accounts |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Run `openssl rand -base64 32` |

#### For the annual limits cron job (optional)

| Variable | How to get it |
|---|---|
| `CRON_SECRET` | Run `openssl rand -base64 32` |

The cron job runs on January 1st each year to refresh IRS limits. Without it, limits stay at 2026 values until you manually update the code.

---

### Step 5 — Set your password

The app uses a single bcrypt-hashed password. Generate the hash for your chosen password:

**Option A — Terminal (if you have Node.js installed):**
```bash
node -e "const b = require('bcryptjs'); b.hash('your-password-here', 10).then(h => console.log(h))"
```

**Option B — Online bcrypt generator:**
Go to [bcrypt-generator.com](https://bcrypt-generator.com), enter your password, set cost factor to 10, and copy the hash.

Paste the resulting string (starts with `$2b$10$…`) as the value of `FRANCESCA_PASSWORD_HASH` in Vercel.

---

### Step 6 — Redeploy

After adding all environment variables, trigger a fresh deploy:

Vercel → your project → **Deployments** → three dots on the latest → **Redeploy**

Your dashboard is now live at `your-project-name.vercel.app`.

---

## First-time use

1. Open your Vercel URL and log in with your password
2. Go to **Settings** and fill in your real numbers:
   - **Current Age** and **Target Retirement Age** (defaults: age 22, retire at 59.5)
   - Base salary, any RSU value, rent, utilities, other expenses
   - Health insurance premium and HSA contribution (monthly)
   - All account balances (401k, Roth IRA, brokerage, HYSA)
   - Return assumptions (leave defaults if unsure)
3. Click **Save** — your profile is now stored in Supabase
4. Return to **Dashboard** — projections use your real numbers

---

## Updating your numbers

Go to **Settings** any time and click **Save**. All projections update instantly.

If you connect Plaid, live balances appear on the dashboard. The Settings page shows your manually entered starting balances — update these periodically if you're not using Plaid, or whenever you make a significant account change.

---

## Connecting Plaid (optional)

Plaid was designed to connect:
- **Wells Fargo** — your checking account
- **E-Trade** — brokerage and HYSA
- **Fidelity** — IRA

To set up:
1. Add the four Plaid env vars (Step 4 above)
2. Start with `PLAID_ENV=sandbox` and test with [Plaid sandbox credentials](https://plaid.com/docs/sandbox/)
3. When ready for real accounts: change `PLAID_ENV` to `production` and swap in your production Plaid secret
4. In the app, connect each institution through the Plaid Link flow

---

## Customizing defaults

**Starting values** — update them in Settings after logging in.

**Pre-filled defaults for new installations** — edit `DEFAULT_PROFILE` in [src/lib/types.ts](src/lib/types.ts) before deploying. Change age, balances, salary, and return assumptions so the app opens with your numbers.

**IRS limits** — `TAX_LIMITS_2026` in [src/lib/types.ts](src/lib/types.ts). Update each January when IRS publishes Rev. Proc. for the new tax year.

**Tax brackets** — [src/lib/tax-engine.ts](src/lib/tax-engine.ts). Federal brackets (IRS Rev. Proc. 2025-22) and CA brackets (FTB Schedule X 2026) are hardcoded. Update when you deploy for a new tax year.

---

## What's not included (V1 scope)

- **Google Sheets sync** — was planned in the original spec; not built in V1
- **Transaction history** — Plaid Investments endpoint for holdings/transactions deferred to V2; only balance snapshots stored
- **Multi-user support** — single-user only
- **Backdoor Roth IRA mechanics** — Mega Backdoor Roth is supported; the separate "backdoor Roth IRA" conversion flow is out of scope

---

## Full environment variable reference

```bash
# Required — app won't start without these
JWT_SECRET=                        # openssl rand -base64 32
FRANCESCA_PASSWORD_HASH=           # bcrypt hash of your password

# AI agent (agent panel won't load without this)
ANTHROPIC_API_KEY=                 # console.anthropic.com

# Supabase (profile falls back to localStorage without these)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Plaid (live balance sync — optional)
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox                  # or: production
PLAID_TOKEN_ENCRYPTION_KEY=        # openssl rand -base64 32

# Cron job (annual IRS limits refresh — optional)
CRON_SECRET=                       # openssl rand -base64 32
```

---

## Disclaimer

This tool is for personal financial modeling only. It does not constitute financial, tax, or legal advice. Tax brackets and contribution limits reflect 2026 IRS Rev. Proc. 2025-22 and CA FTB Schedule X. The tax engine assumes California state taxes, single filing status, and no dependents — projections will differ for other locations or filing circumstances. Actual results will vary based on market performance, legislative changes, and personal circumstances. Consult a licensed financial advisor for advice specific to your situation.
