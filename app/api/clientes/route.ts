import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const busqueda = searchParams.get("q") ?? "";
  const pagina   = parseInt(searchParams.get("pagina") ?? "1");
  const porPagina = parseInt(searchParams.get("por_pagina") ?? "20");
  const desde = (pagina - 1) * porPagina;

  let query = supabase
    .from("clientes")
    .select("*", { count: "exact" })
    .order("nombre", { ascending: true })
    .range(desde, desde + porPagina - 1);

  if (busqueda) {
    query = query.or(`nombre.ilike.%${busqueda}%,nit.ilike.%${busqueda}%,cedula.ilike.%${busqueda}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    clientes: data,
    total: count ?? 0,
    pagina,
    por_pagina: porPagina,
    total_paginas: Math.ceil((count ?? 0) / porPagina),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("clientes")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
