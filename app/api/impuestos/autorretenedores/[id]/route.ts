import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json();

  const nit = String(body.nit ?? "").trim();
  const nombre = String(body.nombre ?? "").trim() || null;

  if (!nit) return NextResponse.json({ error: "El NIT es obligatorio." }, { status: 400 });

  const { data, error } = await supabase
    .from("terceros_autorretenedores")
    .update({ nit, nombre })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { error } = await supabase.from("terceros_autorretenedores").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
