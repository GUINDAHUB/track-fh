import {
  getAverageMinutesToLinkSent,
  getFunnel,
  getKpis,
  getPhaseTimings,
} from "@/lib/db";
import { FunnelChart } from "./ui/FunnelChart";
import { TimingsChart } from "./ui/TimingsChart";
import { LeadInspector } from "./ui/LeadInspector";
import { PendingDocs } from "./ui/PendingDocs";

export default async function Home() {
  const [kpis, funnel, timings, avgToLink] = await Promise.all([
    getKpis(),
    getFunnel(),
    getPhaseTimings(),
    getAverageMinutesToLinkSent(),
  ]);
  const totalLeads = kpis.total_leads || 0;
  const pct = (value: number) =>
    totalLeads > 0 ? `${Math.round((value / totalLeads) * 100)}%` : "0%";

  const convTiming = avgToLink;
  const firstReplyTiming = timings.find((t) => t.fase === "a")?.avg_minutes;

  // Cálculos de drop-off por etapa para métricas avanzadas
  const byEtapa = Object.fromEntries(
    funnel.map((row) => [row.etapa, row.leads] as const)
  );

  const orderedEtapas = [
    "contactados",
    "a_starting",
    "b_province_asked",
    "c_budget_asked",
    "d_buyers_asked",
    "e_job_asked",
    "f_salaries_asked",
    "g_savings_asked",
    "h_urgency_asked",
    "i_debts_asked",
    "k_link_sent",
    "documentacion_enviada",
  ] as const;

  const etapaLabels: Record<string, string> = {
    contactados: "Contactados",
    a_starting: "A · Inicio",
    b_province_asked: "B · Provincia",
    c_budget_asked: "C · Presupuesto",
    d_buyers_asked: "D · Compradores",
    e_job_asked: "E · Trabajo",
    f_salaries_asked: "F · Salarios",
    g_savings_asked: "G · Ahorros",
    h_urgency_asked: "H · Urgencia",
    i_debts_asked: "I · Deudas",
    k_link_sent: "K · Link enviado",
    documentacion_enviada: "Documentación enviada",
  };

  type DropRow = {
    etapa: string;
    leads: number;
    fromPrev: number;
    dropPct: number;
  };

  const dropRows: DropRow[] = orderedEtapas.map((etapa, index) => {
    const leads = byEtapa[etapa] ?? 0;
    const prevLeads =
      index === 0 ? totalLeads : byEtapa[orderedEtapas[index - 1]] ?? 0;
    const fromPrev =
      prevLeads > 0 ? Math.round((leads / prevLeads) * 100) : 0;
    const dropPct = Math.max(0, 100 - fromPrev);
    return { etapa, leads, fromPrev, dropPct };
  });

  // Pregunta con mayor fuga (excluimos contactados y el último paso)
  const dropCandidates = dropRows.filter(
    (row, idx) =>
      idx > 0 && idx < dropRows.length - 1 && byEtapa[row.etapa] !== undefined
  );
  const maxDrop =
    dropCandidates.length > 0
      ? dropCandidates.reduce((max, row) =>
          row.dropPct > max.dropPct ? row : max
        )
      : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-semibold shadow-sm">
              FH
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Dashboard WhatsApp
              </h1>
              <p className="text-xs text-slate-500">
                Fórmula Hogar · seguimiento de leads
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            title="Total leads"
            value={kpis.total_leads}
            accent="from-emerald-500 to-emerald-600"
            subtitle="Entradas al funnel"
          />
          <KpiCard
            title="Sin respuesta (0_template)"
            value={kpis.total_no_responden}
            accent="from-amber-400 to-amber-500"
            subtitle={`${pct(kpis.total_no_responden)} no responden`}
          />
          <KpiCard
            title="Descartados"
            value={kpis.total_descartados}
            accent="from-rose-500 to-rose-600"
            subtitle={`${pct(kpis.total_descartados)} descartados`}
          />
          <KpiCard
            title="Link enviado"
            value={kpis.total_link_enviado}
            accent="from-emerald-500 to-emerald-600"
            subtitle={`${pct(kpis.total_link_enviado)} llegan al final`}
          />
          <KpiCard
            title="Doc. enviada"
            value={kpis.total_doc_enviada}
            accent="from-sky-500 to-sky-600"
            subtitle={`${pct(kpis.total_doc_enviada)} completan formulario`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Funnel de conversación
              </h2>
              <p className="text-xs text-slate-500">
                Desde contacto inicial hasta documentación enviada
              </p>
            </div>
            <FunnelChart data={funnel} />
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Tiempo medio por fase
              </h2>
              <p className="text-xs text-slate-500">
                En minutos · Conversación media{" "}
                {convTiming ? `${convTiming.toFixed(1)} min` : "s/d"}
              </p>
            </div>
            <TimingsChart data={timings} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Conversión por etapa
            </h2>
            <FunnelTable funnel={funnel} totalLeads={totalLeads} />
          </div>
          <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Insights clave de la conversación
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Pregunta con mayor fuga
                </p>
                {maxDrop ? (
                  <>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {etapaLabels[maxDrop.etapa] ?? maxDrop.etapa}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Se queda aquí el{" "}
                      <span className="font-semibold">
                        {maxDrop.dropPct}%{" "}
                      </span>
                      de los leads que llegan desde la etapa anterior.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Sin datos suficientes todavía.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-emerald-50/80 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Tiempo hasta enviar link
                </p>
                <p className="mt-2 text-2xl font-semibold text-emerald-800">
                  {convTiming ? `${convTiming.toFixed(1)} min` : "s/d"}
                </p>
                <p className="mt-1 text-xs text-emerald-900/80">
                  Desde el primer contacto hasta que se envía{" "}
                  <span className="font-semibold">k_link_sent</span>.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-sky-50/80 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
                  Tiempo hasta primera respuesta
                </p>
                <p className="mt-2 text-2xl font-semibold text-sky-800">
                  {firstReplyTiming ? `${firstReplyTiming.toFixed(1)} min` : "s/d"}
                </p>
                <p className="mt-1 text-xs text-sky-900/80">
                  Media desde que escribís hasta que el lead responde a la fase{" "}
                  <span className="font-semibold">A (starting)</span>.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
                  Eficiencia global del funnel
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {pct(kpis.total_doc_enviada)}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    de leads llegan a documentación
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  De todos los leads contactados, cuántos terminan enviando la
                  documentación completa.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Pendientes de documentación y perfil de lead
            </h2>
            <p className="text-xs text-slate-500">
              Haz clic en un teléfono pendiente o busca por número para ver el
              detalle completo de la conversación.
            </p>
          </div>
          <PendingDocs />
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  title,
  value,
  accent,
  subtitle,
}: {
  title: string;
  value: number;
  accent: string;
  subtitle?: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl bg-white/90 p-[1px] shadow-sm ring-1 ring-slate-100">
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 blur-xl transition group-hover:opacity-100 bg-gradient-to-br ${accent}`}
      />
      <div className="relative flex h-full flex-col justify-between rounded-3xl bg-white/95 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold text-slate-900">
            {value?.toLocaleString("es-ES") ?? "0"}
          </p>
          {subtitle && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function FunnelTable({
  funnel,
  totalLeads,
}: {
  funnel: Awaited<ReturnType<typeof getFunnel>>;
  totalLeads: number;
}) {
  const byEtapa = Object.fromEntries(
    funnel.map((row) => [row.etapa, row.leads] as const)
  );

  const ordered = [
    "contactados",
    "a_starting",
    "b_province_asked",
    "c_budget_asked",
    "d_buyers_asked",
    "e_job_asked",
    "f_salaries_asked",
    "g_savings_asked",
    "h_urgency_asked",
    "i_debts_asked",
    "k_link_sent",
    "documentacion_enviada",
  ];

  const rows = ordered.map((etapa, index) => {
    const leads = byEtapa[etapa] ?? 0;
    const prevLeads = index === 0 ? totalLeads : byEtapa[ordered[index - 1]] ?? 0;
    const fromTotal =
      totalLeads > 0 ? Math.round((leads / totalLeads) * 100) : 0;
    const fromPrev =
      prevLeads > 0 ? Math.round((leads / prevLeads) * 100) : 0;
    return { etapa, leads, fromTotal, fromPrev };
  });

  const labelMap: Record<string, string> = {
    contactados: "Contactados",
    a_starting: "A · Inicio",
    b_province_asked: "B · Provincia",
    c_budget_asked: "C · Presupuesto",
    d_buyers_asked: "D · Compradores",
    e_job_asked: "E · Trabajo",
    f_salaries_asked: "F · Salarios",
    g_savings_asked: "G · Ahorros",
    h_urgency_asked: "H · Urgencia",
    i_debts_asked: "I · Deudas",
    k_link_sent: "K · Link enviado",
    documentacion_enviada: "Documentación enviada",
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-3 py-2 font-semibold text-slate-500">Etapa</th>
            <th className="px-3 py-2 font-semibold text-slate-500">Leads</th>
            <th className="px-3 py-2 font-semibold text-slate-500">
              % sobre total
            </th>
            <th className="px-3 py-2 font-semibold text-slate-500">
              % desde anterior
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-[11px]">
          {rows.map((row) => (
            <tr key={row.etapa} className="hover:bg-slate-50/60">
              <td className="px-3 py-2 text-slate-700">
                {labelMap[row.etapa] ?? row.etapa}
              </td>
              <td className="px-3 py-2 tabular-nums text-slate-900">
                {row.leads.toLocaleString("es-ES")}
              </td>
              <td className="px-3 py-2 tabular-nums text-slate-700">
                {row.fromTotal}%
              </td>
              <td className="px-3 py-2 tabular-nums text-slate-700">
                {row.fromPrev}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


