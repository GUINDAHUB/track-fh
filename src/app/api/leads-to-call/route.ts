import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select(
      "telefono,created_at,etiqueta_chatwoot,estado,k_timestamp,nivel_recordatorio"
    )
    .eq("pregunta_actual", "k_link_sent")
    .not("k_timestamp", "is", null)
    .gte("nivel_recordatorio", 2)
    .order("k_timestamp", { ascending: true });

  if (error) {
    console.error("Error obteniendo leads para llamar", error);
    return NextResponse.json(
      { error: "Error interno al listar leads para llamar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ leads: data ?? [] });
}

