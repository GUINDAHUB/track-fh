"use client";

import { useEffect, useState } from "react";

type LeadToCall = {
  telefono: string;
  created_at: string | null;
  etiqueta_chatwoot: string | null;
  estado: string | null;
  k_timestamp: string | null;
  nivel_recordatorio: number | null;
};

export function LeadsToCall() {
  const [leads, setLeads] = useState<LeadToCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/leads-to-call");
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "No se han podido cargar los leads.");
          return;
        }
        setLeads(body.leads ?? []);
      } catch (err) {
        setError("Error de red al cargar los leads para llamar.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function formatDate(value: string | null): string {
    if (!value) return "s/d";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "s/d" : d.toLocaleString("es-ES");
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Leads para llamar (k_link_sent + 2 recordatorios)
        </p>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          {leads.length} leads
        </span>
      </div>
      {loading && (
        <p className="text-xs text-slate-500">Cargando leads para llamar…</p>
      )}
      {error && (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      )}
      {!loading && !error && leads.length === 0 && (
        <p className="text-xs text-slate-500">
          Ahora mismo no hay leads en estado k_link_sent con 2 recordatorios
          enviados.
        </p>
      )}
      <div className="mt-2 max-h-80 space-y-1 overflow-auto pr-1 text-xs">
        {leads.map((lead) => (
          <div
            key={lead.telefono}
            className="flex w-full flex-col rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-left"
          >
            <span className="text-[11px] font-semibold text-slate-800">
              {lead.telefono}
            </span>
            {lead.etiqueta_chatwoot && (
              <span className="mt-0.5 text-[11px] text-slate-500">
                {lead.etiqueta_chatwoot}
              </span>
            )}
            <span className="mt-0.5 text-[10px] text-slate-500">
              Link enviado: {formatDate(lead.k_timestamp || lead.created_at)}
            </span>
            <span className="mt-0.5 text-[10px] text-slate-500">
              Recordatorios enviados: {lead.nivel_recordatorio ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

