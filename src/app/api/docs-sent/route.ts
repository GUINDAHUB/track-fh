import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select("telefono,etiqueta_chatwoot,estado,end_timestamp,created_at")
    .eq("pregunta_actual", "documentacion_enviada")
    .order("end_timestamp", { ascending: false });

  if (error) {
    console.error("Error obteniendo leads con documentación enviada", error);
    return NextResponse.json(
      { error: "Error interno al listar leads con documentación enviada" },
      { status: 500 }
    );
  }

  return NextResponse.json({ leads: data ?? [] });
}
