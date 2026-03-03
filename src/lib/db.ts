import { supabaseServer } from "./supabaseClient";

export type WhatsAppMetrics = {
  total_leads: number;
  total_no_responden: number;
  total_descartados: number;
  total_link_enviado: number;
  total_doc_enviada: number;
};

export async function getKpis(): Promise<WhatsAppMetrics> {
  // Total leads
  const total = await supabaseServer
    .from("whatsapp")
    .select("*", { count: "exact", head: true });

  // Sin respuesta (0_template)
  const noResponden = await supabaseServer
    .from("whatsapp")
    .select("*", { count: "exact", head: true })
    .eq("pregunta_actual", "0_template");

  // Descartados
  const descartados = await supabaseServer
    .from("whatsapp")
    .select("*", { count: "exact", head: true })
    .eq("pregunta_actual", "x_discarded");

  // Link enviado
  const linkEnviado = await supabaseServer
    .from("whatsapp")
    .select("*", { count: "exact", head: true })
    .in("pregunta_actual", ["k_link_sent", "documentacion_enviada"]);

  // Documentación enviada
  const docEnviada = await supabaseServer
    .from("whatsapp")
    .select("*", { count: "exact", head: true })
    .eq("pregunta_actual", "documentacion_enviada");

  return {
    total_leads: total.count ?? 0,
    total_no_responden: noResponden.count ?? 0,
    total_descartados: descartados.count ?? 0,
    total_link_enviado: linkEnviado.count ?? 0,
    total_doc_enviada: docEnviada.count ?? 0,
  };
}

export type FunnelRow = {
  etapa: string;
  leads: number;
};

export async function getFunnel(): Promise<FunnelRow[]> {
  // Obtenemos todos los timestamps relevantes y pregunta_actual
  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select(
      "pregunta_actual,created_at,a_timestamp,b_timestamp,c_timestamp,d_timestamp,e_timestamp,f_timestamp,g_timestamp,h_timestamp,i_timestamp,end_timestamp"
    );

  if (error || !data) {
    console.error("Error obteniendo datos de funnel", error);
    return [];
  }

  const etapasOrdenadas = [
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

  const indexEtapa: Record<(typeof etapasOrdenadas)[number], number> =
    etapasOrdenadas.reduce(
      (acc, etapa, idx) => ({ ...acc, [etapa]: idx }),
      {} as Record<(typeof etapasOrdenadas)[number], number>
    );

  const counts = new Array(etapasOrdenadas.length).fill(0) as number[];

  for (const row of data as any[]) {
    // Determinar la última etapa alcanzada por cada lead
    let lastIndex = 0; // contactados por defecto

    if (row.pregunta_actual === "documentacion_enviada") {
      lastIndex = indexEtapa["documentacion_enviada"];
    } else if (row.pregunta_actual === "k_link_sent") {
      lastIndex = indexEtapa["k_link_sent"];
    } else if (row.i_timestamp) {
      lastIndex = indexEtapa["i_debts_asked"];
    } else if (row.h_timestamp) {
      lastIndex = indexEtapa["h_urgency_asked"];
    } else if (row.g_timestamp) {
      lastIndex = indexEtapa["g_savings_asked"];
    } else if (row.f_timestamp) {
      lastIndex = indexEtapa["f_salaries_asked"];
    } else if (row.e_timestamp) {
      lastIndex = indexEtapa["e_job_asked"];
    } else if (row.d_timestamp) {
      lastIndex = indexEtapa["d_buyers_asked"];
    } else if (row.c_timestamp) {
      lastIndex = indexEtapa["c_budget_asked"];
    } else if (row.b_timestamp) {
      lastIndex = indexEtapa["b_province_asked"];
    } else if (row.a_timestamp) {
      lastIndex = indexEtapa["a_starting"];
    } else {
      lastIndex = indexEtapa["contactados"];
    }

    // Incrementamos todas las etapas hasta la última alcanzada
    for (let i = 0; i <= lastIndex; i++) {
      counts[i] += 1;
    }
  }

  return counts.map((leads, idx) => ({
    etapa: etapasOrdenadas[idx],
    leads,
  }));
}

export type PhaseTimingRow = {
  fase: string;
  avg_minutes: number | null;
};

export async function getPhaseTimings(): Promise<PhaseTimingRow[]> {
  // Para simplificar, calculamos los tiempos en memoria a partir de los timestamps
  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select(
      "created_at,a_timestamp,b_timestamp,c_timestamp,d_timestamp,e_timestamp,f_timestamp,g_timestamp,h_timestamp,i_timestamp,end_timestamp"
    );

  if (error || !data) {
    console.error("Error obteniendo datos de tiempos", error);
    return [];
  }

  type Key =
    | "a_timestamp"
    | "b_timestamp"
    | "c_timestamp"
    | "d_timestamp"
    | "e_timestamp"
    | "f_timestamp"
    | "g_timestamp"
    | "h_timestamp"
    | "i_timestamp";

  const fases: { fase: string; from: Key | "created_at"; to: Key | "end_timestamp" }[] =
    [
      { fase: "a", from: "created_at", to: "a_timestamp" },
      { fase: "b", from: "a_timestamp", to: "b_timestamp" },
      { fase: "c", from: "b_timestamp", to: "c_timestamp" },
      { fase: "d", from: "c_timestamp", to: "d_timestamp" },
      { fase: "e", from: "d_timestamp", to: "e_timestamp" },
      { fase: "f", from: "e_timestamp", to: "f_timestamp" },
      { fase: "g", from: "f_timestamp", to: "g_timestamp" },
      { fase: "h", from: "g_timestamp", to: "h_timestamp" },
      { fase: "i", from: "h_timestamp", to: "i_timestamp" },
      { fase: "conversacion_completa", from: "created_at", to: "end_timestamp" },
    ];

  const results: PhaseTimingRow[] = [];

  for (const fase of fases) {
    let totalMinutes = 0;
    let count = 0;

    for (const row of data as any[]) {
      const from = row[fase.from];
      const to = row[fase.to];
      if (!from || !to) continue;

      const fromDate = new Date(from);
      const toDate = new Date(to);
      const diffMs = toDate.getTime() - fromDate.getTime();
      if (isNaN(diffMs) || diffMs < 0) continue;

      const minutes = diffMs / 1000 / 60;
      totalMinutes += minutes;
      count += 1;
    }

    results.push({
      fase: fase.fase,
      avg_minutes: count > 0 ? totalMinutes / count : null,
    });
  }

  return results;
}

export async function getAverageMinutesToLinkSent(): Promise<number | null> {
  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select(
      "pregunta_actual,created_at,a_timestamp,b_timestamp,c_timestamp,d_timestamp,e_timestamp,f_timestamp,g_timestamp,h_timestamp,i_timestamp,j_timestamp,end_timestamp"
    );

  if (error || !data) {
    console.error("Error obteniendo datos para tiempo a link_sent", error);
    return null;
  }

  let totalMinutes = 0;
  let count = 0;

  for (const row of data as any[]) {
    if (
      row.pregunta_actual !== "k_link_sent" &&
      row.pregunta_actual !== "documentacion_enviada"
    ) {
      continue;
    }

    const created = row.created_at ? new Date(row.created_at) : null;
    if (!created) continue;

    const candidates = [
      row.end_timestamp,
      row.j_timestamp,
      row.i_timestamp,
      row.h_timestamp,
      row.g_timestamp,
      row.f_timestamp,
      row.e_timestamp,
      row.d_timestamp,
      row.c_timestamp,
      row.b_timestamp,
      row.a_timestamp,
    ].filter(Boolean);

    if (candidates.length === 0) continue;

    const lastTs = new Date(candidates[candidates.length - 1] as string);
    const diffMs = lastTs.getTime() - created.getTime();
    if (isNaN(diffMs) || diffMs < 0) continue;

    totalMinutes += diffMs / 1000 / 60;
    count += 1;
  }

  return count > 0 ? totalMinutes / count : null;
}

