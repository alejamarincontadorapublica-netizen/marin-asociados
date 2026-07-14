import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  const {
    cliente_id, documento_id, periodo_inicio, periodo_fin,
    concepto, tarifa, base, valor_retenido,
  } = body;

  if (!cliente_id || !documento_id || !periodo_inicio || !periodo_fin || !concepto) {
    return NextResponse.json({ error: "Faltan datos de la retención." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("retenciones_fuente")
    .upsert(
      [{ cliente_id, documento_id, periodo_inicio, periodo_fin, concepto, tarifa, base, valor_retenido }],
      { onConflict: "documento_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
