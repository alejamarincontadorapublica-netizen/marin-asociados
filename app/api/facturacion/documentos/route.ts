import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get("cliente_id");
  const grupo     = searchParams.get("grupo");
  const pagina    = parseInt(searchParams.get("pagina") ?? "1");
  const porPagina = 50;
  const desde     = (pagina - 1) * porPagina;

  let query = supabase
    .from("documentos")
    .select("*", { count: "exact" })
    .order("fecha_emision", { ascending: false })
    .range(desde, desde + porPagina - 1);

  if (clienteId) query = query.eq("cliente_id", clienteId);
  if (grupo)     query = query.eq("grupo", grupo);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ documentos: data, total: count ?? 0, pagina, por_pagina: porPagina });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const clienteId = searchParams.get("cliente_id");
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });

  const { error } = await supabase.from("documentos").delete().eq("cliente_id", clienteId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
