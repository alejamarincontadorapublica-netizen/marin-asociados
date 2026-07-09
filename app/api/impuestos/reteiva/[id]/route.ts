import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data: certificado } = await supabase
    .from("certificados_reteiva")
    .select("archivo_ruta")
    .eq("id", id)
    .single();

  if (certificado?.archivo_ruta) {
    await supabase.storage.from("reteiva-certificados").remove([certificado.archivo_ruta]);
  }

  const { error } = await supabase.from("certificados_reteiva").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
