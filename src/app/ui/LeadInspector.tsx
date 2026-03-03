"use client";

import { useEffect, useState } from "react";

type LeadRecord = {
  telefono: string;
  pregunta_actual: string;
  estado: string | null;
  etiqueta_chatwoot: string | null;
  created_at: string | null;
  end_timestamp: string | null;
  a_respuesta: string | null;
  a_timestamp: string | null;
  b_respuesta: string | null;
  b_timestamp: string | null;
  c_respuesta: string | null;
  c_timestamp: string | null;
  d_respuesta: string | null;
  d_timestamp: string | null;
  e_respuesta: string | null;
  e_timestamp: string | null;
  f_respuesta: string | null;
  f_timestamp: string | null;
  g_respuesta: string | null;
  g_timestamp: string | null;
  h_respuesta: string | null;
  h_timestamp: string | null;
  i_respuesta: string | null;
  i_timestamp: string | null;
};

const questionMeta: {
  key: keyof LeadRecord;
  tsKey: keyof LeadRecord;
  label: string;
}[] = [
  { key: "a_respuesta", tsKey: "a_timestamp", label: "A · Inicio" },
  { key: "b_respuesta", tsKey: "b_timestamp", label: "B · Provincia" },
  { key: "c_respuesta", tsKey: "c_timestamp", label: "C · Presupuesto" },
  { key: "d_respuesta", tsKey: "d_timestamp", label: "D · Compradores" },
  { key: "e_respuesta", tsKey: "e_timestamp", label: "E · Trabajo" },
  { key: "f_respuesta", tsKey: "f_timestamp", label: "F · Salarios" },
  { key: "g_respuesta", tsKey: "g_timestamp", label: "G · Ahorros" },
  { key: "h_respuesta", tsKey: "h_timestamp", label: "H · Urgencia" },
  { key: "i_respuesta", tsKey: "i_timestamp", label: "I · Deudas" },
];

export function LeadInspector({
  initialTelefono,
}: {
  initialTelefono?: string;
}) {
  const [telefono, setTelefono] = useState(initialTelefono ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<LeadRecord | null>(null);

  async function searchByTelefono(value: string) {
    const clean = value.trim();
    if (!clean) {
      setError("Introduce un número de teléfono.");
      setLead(null);
      return;
    }

    setError(null);
    setLead(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ telefono: clean });
      const res = await fetch(`/api/lead?${params.toString()}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "No se ha podido buscar el lead.");
        return;
      }
      setLead(body.lead as LeadRecord);
    } catch (err) {
      setError("Error de red al buscar el lead.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await searchByTelefono(telefono);
  }

  useEffect(() => {
    if (initialTelefono) {
      setTelefono(initialTelefono);
      void searchByTelefono(initialTelefono);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTelefono]);

  const answeredCount =
    lead &&
    questionMeta.filter((q) => {
      const value = lead[q.key];
      return value !== null && value !== "";
    }).length;

  const createdAt =
    lead?.created_at && new Date(lead.created_at).toLocaleString("es-ES");
  const endedAt =
    lead?.end_timestamp &&
    new Date(lead.end_timestamp).toLocaleString("es-ES");

  let durationMinutes: number | null = null;
  if (lead?.created_at && lead.end_timestamp) {
    const start = new Date(lead.created_at);
    const end = new Date(lead.end_timestamp);
    const diffMs = end.getTime() - start.getTime();
    if (!isNaN(diffMs) && diffMs >= 0) {
      durationMinutes = diffMs / 1000 / 60;
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/90 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-600">
            Buscar lead por teléfono
          </label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-0 transition focus:border-emerald-400 focus:bg-white"
            placeholder="Ej: +34 600 123 456"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {loading ? "Buscando..." : "Ver perfil"}
        </button>
      </form>

      {error && (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      )}

      {lead && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Resumen del lead
            </p>
            <div className="space-y-1 text-sm text-slate-800">
              <p>
                <span className="text-slate-500">Teléfono:</span>{" "}
                <span className="font-medium">{lead.telefono}</span>
              </p>
              <p>
                <span className="text-slate-500">Estado:</span>{" "}
                <span className="font-medium">
                  {lead.estado ?? "en_proceso"}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Pregunta actual:</span>{" "}
                <span className="font-medium">{lead.pregunta_actual}</span>
              </p>
              {lead.etiqueta_chatwoot && (
                <p>
                  <span className="text-slate-500">Etiqueta Chatwoot:</span>{" "}
                  <span className="font-medium">{lead.etiqueta_chatwoot}</span>
                </p>
              )}
              <p>
                <span className="text-slate-500">Preguntas respondidas:</span>{" "}
                <span className="font-medium">{answeredCount ?? 0} / 9</span>
              </p>
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>
                <span className="text-slate-500">Creado:</span>{" "}
                {createdAt ?? "s/d"}
              </p>
              <p>
                <span className="text-slate-500">Fin conversación:</span>{" "}
                {endedAt ?? "en curso"}
              </p>
              <p>
                <span className="text-slate-500">Duración total:</span>{" "}
                {durationMinutes
                  ? `${durationMinutes.toFixed(1)} min`
                  : "s/d"}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3 rounded-2xl border border-slate-100 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Timeline de respuestas
            </p>
            <ol className="space-y-3 text-sm">
              <li className="relative flex gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Contacto iniciado
                  </p>
                  <p className="text-xs text-slate-500">
                    {createdAt ?? "fecha no disponible"}
                  </p>
                </div>
              </li>
              {questionMeta.map(({ key, tsKey, label }) => {
                const answer = lead[key];
                const ts = lead[tsKey] as string | null;
                if (!ts && !answer) return null;
                const tsText = ts
                  ? new Date(ts).toLocaleString("es-ES")
                  : "fecha no disponible";
                return (
                  <li key={key as string} className="relative flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        {label}
                      </p>
                      <p className="text-xs text-slate-500">{tsText}</p>
                      {answer && (
                        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-1 text-xs text-slate-800">
                          {answer}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

