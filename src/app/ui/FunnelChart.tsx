"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import type { FunnelRow } from "@/lib/db";

type Props = {
  data: FunnelRow[];
};

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
  documentacion_enviada: "Doc. enviada",
};

export function FunnelChart({ data }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const chartData = data.map((row) => ({
    ...row,
    label: etapaLabels[row.etapa] ?? row.etapa,
  }));

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ bottom: 40, left: 0, right: 16 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [
              value.toLocaleString("es-ES") + " leads",
              "Leads",
            ]}
          />
          <Bar
            dataKey="leads"
            fill="#16a34a"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

