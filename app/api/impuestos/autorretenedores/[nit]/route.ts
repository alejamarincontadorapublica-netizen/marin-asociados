import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ nit: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { nit } = await params;

  const { error } = await supabase.from("terceros_autorretenedores").delete().eq("nit", nit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
