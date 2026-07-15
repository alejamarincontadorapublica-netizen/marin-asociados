import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parsearValor } from "@/lib/reglas-tributarias";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const formData = await request.formData();
    const clienteId = formData.get("cliente_id") as string;
    const periodoInicio = formData.get("periodo_inicio") as string;
    const periodoFin = formData.get("periodo_fin") as string;
    const archivo = formData.get("archivo") as File | null;

    if (!clienteId || !periodoInicio || !periodoFin || !archivo) {
      return NextResponse.json({ error: "Faltan datos para importar el papel de trabajo." }, { status: 400 });
    }

    const buffer = await archivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

    // Buscar la hoja de compras (donde está la columna "RTE FTE")
    const nombreHoja =
      workbook.SheetNames.find((n) => /compras/i.test(n)) ?? workbook.SheetNames[0];
    const sheet = workbook.Sheets[nombreHoja];
    const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, blankrows: false });

    if (filas.length === 0) {
      return NextResponse.json({ error: `La hoja "${nombreHoja}" está vacía.` }, { status: 400 });
    }

    const claves = Object.keys(filas[0]);
    const col = (pat: RegExp) => claves.find((k) => pat.test(k.trim())) ?? null;

    const cCufe = col(/cufe|cude/i);
    const cRete = col(/rte\s*f?te|retenci[oó]n\s*en\s*la\s*fuente|rtefte/i);
    const cSuma = col(/^suma$/i);
    const cBase = col(/base/i);

    if (!cCufe) {
      return NextResponse.json({ error: `No se encontró una columna de CUFE en la hoja "${nombreHoja}".` }, { status: 400 });
    }
    if (!cRete) {
      return NextResponse.json({ error: `No se encontró la columna "RTE FTE" en la hoja "${nombreHoja}".` }, { status: 400 });
    }

    const { data: conceptos } = await supabase
      .from("conceptos_retefuente")
      .select("*")
      .eq("activo", true);

    const omitidas: { cufe: string; motivo: string }[] = [];
    let aplicadas = 0;
    let totalRetenido = 0;

    for (const fila of filas) {
      const cufe = String(fila[cCufe] ?? "").trim();
      if (!cufe) continue;

      const valorRetenido = parsearValor(fila[cRete]);
      if (!valorRetenido || valorRetenido <= 0) continue;

      // No usar .maybeSingle(): si el mismo CUFE quedó duplicado por un
      // problema de sincronización anterior, .maybeSingle() falla en vez
      // de devolver el documento. Tomamos el primero si hay varios.
      const { data: docs } = await supabase
        .from("documentos")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("cufe", cufe)
        .limit(1);

      const doc = docs?.[0];
      if (!doc) {
        omitidas.push({ cufe, motivo: "No está sincronizado en Facturación DIAN para este cliente." });
        continue;
      }

      const base = parsearValor(cSuma ? fila[cSuma] : null) || parsearValor(cBase ? fila[cBase] : null);
      if (!base || base <= 0) {
        omitidas.push({ cufe, motivo: "No se pudo determinar la base (SUMA/BASE) en el archivo." });
        continue;
      }

      const tarifaCalculada = Math.round((valorRetenido / base) * 10000) / 100;
      const conceptoCercano = (conceptos ?? []).reduce<{ concepto: string; dif: number } | null>((mejor, c) => {
        const dif = Math.abs(c.tarifa - tarifaCalculada);
        if (!mejor || dif < mejor.dif) return { concepto: c.concepto, dif };
        return mejor;
      }, null);
      const concepto =
        conceptoCercano && conceptoCercano.dif <= 0.15
          ? conceptoCercano.concepto
          : `Tarifa ${tarifaCalculada}% (verificar concepto)`;

      const { error: upsertError } = await supabase
        .from("retenciones_fuente")
        .upsert(
          [{
            cliente_id: clienteId,
            documento_id: doc.id,
            periodo_inicio: periodoInicio,
            periodo_fin: periodoFin,
            concepto,
            tarifa: tarifaCalculada,
            base,
            valor_retenido: valorRetenido,
          }],
          { onConflict: "documento_id" }
        );

      if (upsertError) {
        omitidas.push({ cufe, motivo: upsertError.message });
        continue;
      }

      aplicadas++;
      totalRetenido += valorRetenido;
    }

    return NextResponse.json({ aplicadas, omitidas, totalRetenido });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
