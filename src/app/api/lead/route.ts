import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const telefono = searchParams.get("telefono");

  if (!telefono) {
    return NextResponse.json(
      { error: "Falta el parámetro telefono" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseServer
    .from("whatsapp")
    .select(
      "telefono,pregunta_actual,estado,etiqueta_chatwoot,created_at,end_timestamp,a_respuesta,a_timestamp,b_respuesta,b_timestamp,c_respuesta,c_timestamp,d_respuesta,d_timestamp,e_respuesta,e_timestamp,f_respuesta,f_timestamp,g_respuesta,g_timestamp,h_respuesta,h_timestamp,i_respuesta,i_timestamp"
    )
    .eq("telefono", telefono)
    .maybeSingle();

  if (error) {
    console.error("Error buscando lead por teléfono", error);
    return NextResponse.json(
      { error: "Error interno al buscar el lead" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "No se ha encontrado ningún lead con ese teléfono" },
      { status: 404 }
    );
  }

  return NextResponse.json({ lead: data });
}

