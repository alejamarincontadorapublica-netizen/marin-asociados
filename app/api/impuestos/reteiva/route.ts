import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const formData = await request.formData();

    const clienteId       = formData.get("cliente_id") as string;
    const periodoInicio   = formData.get("periodo_inicio") as string;
    const periodoFin      = formData.get("periodo_fin") as string;
    const nitAgente       = formData.get("nit_agente_retenedor") as string;
    const nombreAgente    = (formData.get("nombre_agente_retenedor") as string) || null;
    const numeroCert      = (formData.get("numero_certificado") as string) || null;
    const montoStr        = formData.get("monto_retenido") as string;
    const archivo          = formData.get("archivo") as File | null;

    if (!clienteId || !periodoInicio || !periodoFin || !nitAgente || !montoStr) {
      return NextResponse.json({ error: "Faltan datos obligatorios del certificado." }, { status: 400 });
    }

    const montoRetenido = parseFloat(montoStr);
    if (isNaN(montoRetenido) || montoRetenido <= 0) {
      return NextResponse.json({ error: "El monto retenido no es válido." }, { status: 400 });
    }

    let archivoRuta: string | null = null;
    let archivoNombre: string | null = null;

    if (archivo && archivo.size > 0) {
      const extension = archivo.name.split(".").pop() ?? "pdf";
      const ruta = `${clienteId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("reteiva-certificados")
        .upload(ruta, archivo, { contentType: archivo.type });

      if (uploadError) {
        return NextResponse.json({ error: `Error al subir el archivo: ${uploadError.message}` }, { status: 500 });
      }

      archivoRuta = ruta;
      archivoNombre = archivo.name;
    }

    const { data, error } = await supabase
      .from("certificados_reteiva")
      .insert([{
        cliente_id: clienteId,
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        nit_agente_retenedor: nitAgente,
        nombre_agente_retenedor: nombreAgente,
        numero_certificado: numeroCert,
        monto_retenido: montoRetenido,
        archivo_ruta: archivoRuta,
        archivo_nombre: archivoNombre,
      }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
