import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select("telefono,created_at,etiqueta_chatwoot,a_timestamp,b_timestamp,c_timestamp,d_timestamp,e_timestamp,f_timestamp,g_timestamp,h_timestamp,i_timestamp")
    .eq("pregunta_actual", "k_link_sent")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error obteniendo pendientes de documentación", error);
    return NextResponse.json(
      { error: "Error interno al listar pendientes de documentación" },
      { status: 500 }
    );
  }

  return NextResponse.json({ leads: data ?? [] });
}

