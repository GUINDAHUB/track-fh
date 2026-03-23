# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

There are no tests configured in this project.

## Environment Variables

Create a `.env.local` file with:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Both are required. The app uses the **service role key** (not the anon key) for server-side reads.

## Architecture

This is a **Next.js 16 App Router** dashboard for tracking WhatsApp lead conversations for "Formula Hogar". It uses:

- **Supabase** as the database (PostgreSQL via `@supabase/supabase-js`)
- **Recharts** for charts
- **Tailwind CSS v4** for styling
- **React Compiler** (`babel-plugin-react-compiler`, enabled in `next.config.ts`)

### Data flow

The single `whatsapp` Supabase table stores one row per lead. Each lead has:
- `telefono` — phone number (primary identifier)
- `pregunta_actual` — current funnel stage (e.g. `"a_starting"`, `"k_link_sent"`, `"documentacion_enviada"`, `"x_discarded"`, `"0_template"`)
- `{a–i,j,k}_timestamp` — timestamps when each conversation phase was reached
- `{a–i}_respuesta` — lead's answers per phase
- `created_at`, `end_timestamp` — conversation start/end
- `etiqueta_chatwoot`, `estado` — CRM metadata
- `nivel_recordatorio` — number of follow-up reminders sent

### Rendering split

- **`src/app/page.tsx`** — Server Component. Fetches all KPIs, funnel, timing data in parallel at request time (`force-dynamic`, `revalidate = 0`). Computes funnel drop-off analytics in-memory.
- **`src/app/ui/PendingDocs.tsx`** and **`src/app/ui/LeadsToCall.tsx`** — Client Components. Fetch their data client-side via `/api/pending-docs` and `/api/leads-to-call` respectively.
- **`src/app/ui/LeadInspector.tsx`**, **`FunnelChart.tsx`**, **`TimingsChart.tsx`** — UI components for displaying data.

### Data access layer

All Supabase queries are in **`src/lib/db.ts`**:
- `getKpis()` — counts by `pregunta_actual` value
- `getFunnel()` — reconstructs the ordered funnel by checking which timestamps are present on each lead (a lead is counted at every stage it has passed through)
- `getPhaseTimings()` — computes average minutes between consecutive phase timestamps
- `getAverageMinutesToLinkSent()` — average total conversation time for leads that reached `k_link_sent`

The Supabase client in `src/lib/supabaseClient.ts` is a server-only singleton (`persistSession: false`). Never import it in Client Components.

### Funnel stage order

```
contactados → a_starting → b_province_asked → c_budget_asked → d_buyers_asked →
e_job_asked → f_salaries_asked → g_savings_asked → h_urgency_asked → i_debts_asked →
k_link_sent → documentacion_enviada
```

Terminal states (not in funnel): `0_template` (no response), `x_discarded` (discarded).
