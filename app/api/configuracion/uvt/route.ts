import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const valor = parseFloat(body.valor);
  const anio = parseInt(body.anio);

  if (isNaN(valor) || isNaN(anio)) {
    return NextResponse.json({ error: "Valor y año de la UVT son obligatorios." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("configuracion_valores")
    .upsert(
      [{ clave: "uvt_vigente", valor: { valor, anio }, updated_at: new Date().toISOString() }],
      { onConflict: "clave" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
