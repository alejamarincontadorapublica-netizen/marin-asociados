import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("conceptos_retefuente")
    .select("*")
    .order("concepto", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const concepto = String(body.concepto ?? "").trim();
  const base_uvt = parseFloat(body.base_uvt ?? 0) || 0;
  const tarifa = parseFloat(body.tarifa ?? 0);

  if (!concepto || isNaN(tarifa)) {
    return NextResponse.json({ error: "Concepto y tarifa son obligatorios." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conceptos_retefuente")
    .insert([{ concepto, base_uvt, tarifa }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
