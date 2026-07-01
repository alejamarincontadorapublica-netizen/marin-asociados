import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { clasificarDocumento, parsearValor } from "@/lib/reglas-tributarias";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const formData    = await request.formData();
    const clienteId   = formData.get("cliente_id") as string;
    const emitidosXls = formData.get("emitidos") as File | null;
    const recibidosXls = formData.get("recibidos") as File | null;

    if (!clienteId) {
      return NextResponse.json({ error: "Falta el cliente." }, { status: 400 });
    }

    // Obtener datos del cliente (AIU, porcentaje)
    const { data: cliente } = await supabase
      .from("clientes")
      .select("factura_aiu, porcentaje_aiu")
      .eq("id", clienteId)
      .single();

    const documentos: Record<string, unknown>[] = [];

    // Parsear CSV/TSV exportado de Excel como texto
    async function procesarArchivo(archivo: File, grupo: "Emitido" | "Recibido") {
      const texto = await archivo.text();
      const lineas = texto.split(/\r?\n/).filter((l) => l.trim());
      if (lineas.length < 2) return;

      const encabezados = lineas[0].split("\t").map((h) => h.trim());
      const iTipo  = encabezados.findIndex((h) => h.toLowerCase().includes("tipo de documento"));
      const iIva   = encabezados.findIndex((h) => h.toLowerCase() === "iva");
      const iBase  = encabezados.findIndex((h) => h.toLowerCase() === "base");
      const iTotal = encabezados.findIndex((h) => h.toLowerCase() === "total");
      const iCufe  = encabezados.findIndex((h) => h.toLowerCase().includes("cufe") || h.toLowerCase().includes("cude"));
      const iFecha = encabezados.findIndex((h) => h.toLowerCase().includes("fecha"));
      const iNit   = encabezados.findIndex((h) => h.toLowerCase().includes("nit"));
      const iNombre = encabezados.findIndex((h) => h.toLowerCase().includes("nombre") || h.toLowerCase().includes("razón"));

      for (let i = 1; i < lineas.length; i++) {
        const cols = lineas[i].split("\t");
        const tipoDoc = iTipo >= 0 ? (cols[iTipo] ?? "").trim() : "";
        if (!tipoDoc) continue;

        const clasificacion = clasificarDocumento(tipoDoc);
        const iva   = parsearValor(iIva  >= 0 ? cols[iIva]  : 0);
        const base  = parsearValor(iBase >= 0 ? cols[iBase] : 0);
        const total = parsearValor(iTotal >= 0 ? cols[iTotal] : 0);

        documentos.push({
          cliente_id:     clienteId,
          tipo_documento: tipoDoc,
          grupo,
          cufe:           iCufe  >= 0 ? (cols[iCufe]  ?? "").trim() : null,
          fecha_emision:  iFecha >= 0 ? parsearFecha(cols[iFecha]) : null,
          nit_emisor:     iNit   >= 0 ? (cols[iNit]   ?? "").trim() : null,
          nombre_emisor:  iNombre >= 0 ? (cols[iNombre] ?? "").trim() : null,
          base,
          iva,
          total,
          clasificacion,
          deducible: clasificacion === "IGNORAR" ? null :
                     clasificacion === "FACTURA" ? "deducible" : "deducible",
        });
      }
    }

    if (emitidosXls)  await procesarArchivo(emitidosXls,  "Emitido");
    if (recibidosXls) await procesarArchivo(recibidosXls, "Recibido");

    if (documentos.length === 0) {
      return NextResponse.json({ error: "No se encontraron documentos en los archivos." }, { status: 400 });
    }

    // Guardar en Supabase (upsert por CUFE para evitar duplicados)
    const { error: insertError } = await supabase
      .from("documentos")
      .upsert(documentos, { onConflict: "cufe", ignoreDuplicates: false });

    if (insertError) {
      // Si falla upsert por constraint, intentar insert ignorando duplicados
      const { error: insertError2 } = await supabase
        .from("documentos")
        .insert(documentos);
      if (insertError2) {
        return NextResponse.json({ error: insertError2.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: true,
      total: documentos.length,
      emitidos:  documentos.filter((d) => d.grupo === "Emitido").length,
      recibidos: documentos.filter((d) => d.grupo === "Recibido").length,
      cliente_aiu: cliente?.factura_aiu ?? false,
    });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function parsearFecha(valor: string | undefined): string | null {
  if (!valor) return null;
  const v = valor.trim();
  // Formato DD/MM/YYYY
  const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const [, d, mo, a] = m;
    const año = a.length === 2 ? "20" + a : a;
    return `${año}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}
