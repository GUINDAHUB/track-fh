"use client";

import { useEffect, useState } from "react";

type DocsSentLead = {
  telefono: string;
  etiqueta_chatwoot: string | null;
  estado: string | null;
  end_timestamp: string | null;
  created_at: string | null;
};

export function DocsSent() {
  const [leads, setLeads] = useState<DocsSentLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/docs-sent");
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "No se han podido cargar los leads.");
          return;
        }
        setLeads(body.leads ?? []);
      } catch {
        setError("Error de red al cargar los leads con documentación enviada.");
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
          Documentación enviada
        </p>
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
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
          Ahora mismo no hay leads con documentación enviada.
        </p>
      )}
      <div className="mt-2 max-h-80 space-y-1 overflow-auto pr-1 text-xs">
        {leads.map((lead) => (
          <div
            key={lead.telefono}
            className="flex w-full flex-col rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
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
              Documentación enviada: {formatDate(lead.end_timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
