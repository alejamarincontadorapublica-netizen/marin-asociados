import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("terceros_autorretenedores")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const nit = String(body.nit ?? "").trim();
  const nombre = String(body.nombre ?? "").trim() || null;

  if (!nit) return NextResponse.json({ error: "El NIT es obligatorio." }, { status: 400 });

  const { data, error } = await supabase
    .from("terceros_autorretenedores")
    .upsert([{ nit, nombre }], { onConflict: "nit" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
