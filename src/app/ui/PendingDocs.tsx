"use client";

import { useEffect, useState } from "react";
import { LeadInspector } from "./LeadInspector";

type PendingLead = {
  telefono: string;
  created_at: string | null;
  etiqueta_chatwoot: string | null;
  a_timestamp: string | null;
  b_timestamp: string | null;
  c_timestamp: string | null;
  d_timestamp: string | null;
  e_timestamp: string | null;
  f_timestamp: string | null;
  g_timestamp: string | null;
  h_timestamp: string | null;
  i_timestamp: string | null;
};

export function PendingDocs() {
  const [leads, setLeads] = useState<PendingLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTelefono, setSelectedTelefono] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/pending-docs");
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "No se han podido cargar los pendientes.");
          return;
        }
        setLeads(body.leads ?? []);
      } catch (err) {
        setError("Error de red al cargar los pendientes.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function getLastActivity(lead: PendingLead): string {
    const tsList = [
      lead.i_timestamp,
      lead.h_timestamp,
      lead.g_timestamp,
      lead.f_timestamp,
      lead.e_timestamp,
      lead.d_timestamp,
      lead.c_timestamp,
      lead.b_timestamp,
      lead.a_timestamp,
    ].filter(Boolean) as string[];
    if (tsList.length === 0) {
      return lead.created_at
        ? new Date(lead.created_at).toLocaleString("es-ES")
        : "s/d";
    }
    const last = new Date(tsList[0]);
    return last.toLocaleString("es-ES");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-2xl border border-slate-100 bg-white/90 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Pendientes de documentación
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              {leads.length} leads
            </span>
          </div>
          {loading && (
            <p className="text-xs text-slate-500">Cargando leads…</p>
          )}
          {error && (
            <p className="text-xs font-medium text-rose-600">{error}</p>
          )}
          {!loading && !error && leads.length === 0 && (
            <p className="text-xs text-slate-500">
              Ahora mismo no hay leads en k_link_sent sin documentación.
            </p>
          )}
          <div className="mt-2 max-h-72 space-y-1 overflow-auto pr-1 text-xs">
            {leads.map((lead) => (
              <button
                key={lead.telefono}
                type="button"
                onClick={() => setSelectedTelefono(lead.telefono)}
                className={`flex w-full flex-col rounded-xl border px-3 py-2 text-left transition ${
                  selectedTelefono === lead.telefono
                    ? "border-emerald-500 bg-emerald-50/70"
                    : "border-slate-100 bg-slate-50/80 hover:bg-slate-100"
                }`}
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
                  Última actividad: {getLastActivity(lead)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <LeadInspector initialTelefono={selectedTelefono ?? undefined} />
        </div>
      </div>
    </div>
  );
}

