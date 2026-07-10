import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  const {
    cliente_id, periodo_inicio, periodo_fin,
    iva_generado, iva_descontable, saldo, detalle, es_final,
  } = body;

  if (!cliente_id || !periodo_inicio || !periodo_fin) {
    return NextResponse.json({ error: "Faltan datos del periodo." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("resultados")
    .upsert(
      [{
        cliente_id,
        periodo_inicio,
        periodo_fin,
        tipo: "IVA",
        iva_generado,
        iva_descontable,
        saldo,
        detalle,
        es_final: es_final ?? true,
      }],
      { onConflict: "cliente_id,periodo_inicio,periodo_fin,tipo" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
