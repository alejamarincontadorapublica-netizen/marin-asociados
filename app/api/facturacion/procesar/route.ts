import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { clasificarDocumento, parsearValor } from "@/lib/reglas-tributarias";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  try {
    const formData      = await request.formData();
    const clienteId     = formData.get("cliente_id") as string;
    const emitidosFile  = formData.get("emitidos")  as File | null;
    const recibidosFile = formData.get("recibidos") as File | null;
    const aiuStr        = formData.get("aiu_porcentaje") as string | null;
    const aiuPorcentaje = aiuStr ? parseFloat(aiuStr) : null;

    if (!clienteId) {
      return NextResponse.json({ error: "Falta el cliente." }, { status: 400 });
    }

    const documentos: Record<string, unknown>[] = [];

    async function procesarExcel(archivo: File, grupo: "Emitido" | "Recibido") {
      const buffer   = await archivo.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const filas    = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: null,
        blankrows: false,
      });
      if (filas.length === 0) return;

      // Detectar columnas por nombre (la DIAN varía mayúsculas y acentos)
      const claves = Object.keys(filas[0]);
      const col    = (pat: RegExp) => claves.find((k) => pat.test(k.trim())) ?? null;

      const cTipo   = col(/tipo\s*de\s*documento/i);
      const cIva    = col(/^iva$/i);
      // La DIAN a veces trae "BASE" y a veces "BASE IVA" — antes solo se
      // capturaba el nombre exacto "BASE" y por eso quedaba en $0 seguido.
      const cBase      = col(/base/i);
      const cSuma      = col(/^suma$/i);
      const cExcluidos = col(/exclu|except/i);
      const cTotal     = col(/^total$/i);
      const cCufe   = col(/cufe|cude/i);
      const cFecha  = col(/fecha/i);
      const cNit    = col(/nit/i);
      const cNombre = col(/nombre|raz[oó]n/i);
      const cNumero = col(/n[uú]mero.*(factura|documento)/i) ?? col(/^folio$/i) ?? col(/consecutivo/i);

      for (const fila of filas) {
        const tipoDoc = cTipo ? String(fila[cTipo] ?? "").trim() : "";
        if (!tipoDoc) continue;

        const clasificacion = clasificarDocumento(tipoDoc);
        const iva    = parsearValor(cIva   ? fila[cIva]   : 0);
        const base      = parsearValor(cBase  ? fila[cBase]  : 0);
        const excluidos = cExcluidos ? parsearValor(fila[cExcluidos]) : null;
        // Cuando el Excel no trae "SUMA" directamente (ej. hoja de Ventas),
        // se calcula igual: base gravada + excluido/exceptuado.
        const suma   = cSuma ? parsearValor(fila[cSuma]) : (base || excluidos) ? base + (excluidos ?? 0) : null;
        const total  = parsearValor(cTotal ? fila[cTotal] : 0);
        const cufe   = cCufe   ? (String(fila[cCufe]  ?? "").trim() || null) : null;
        const nit    = cNit    ? (String(fila[cNit]   ?? "").trim() || null) : null;
        const nombre = cNombre ? (String(fila[cNombre]?? "").trim() || null) : null;
        const fecha  = parsearFecha(cFecha ? fila[cFecha] : null);
        const numero = cNumero ? (String(fila[cNumero]?? "").trim() || null) : null;

        documentos.push({
          cliente_id:     clienteId,
          tipo_documento: tipoDoc,
          grupo,
          cufe,
          fecha_emision:  fecha,
          nit_emisor:     nit,
          nombre_emisor:  nombre,
          base,
          suma,
          excluidos,
          iva,
          total,
          clasificacion,
          deducible:      clasificacion === "IGNORAR" ? "no_deducible" : "deducible",
          aiu_porcentaje: aiuPorcentaje,
          numero_documento: numero,
        });
      }
    }

    if (emitidosFile)  await procesarExcel(emitidosFile,  "Emitido");
    if (recibidosFile) await procesarExcel(recibidosFile, "Recibido");

    if (documentos.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron documentos. Verifica que sean los archivos Excel exportados desde la DIAN." },
        { status: 400 }
      );
    }

    const conCufe = documentos.filter((d) => d.cufe);
    const sinCufe = documentos.filter((d) => !d.cufe);

    if (conCufe.length > 0) {
      // Intentar upsert; si no existe el constraint único, eliminar duplicados y luego insertar
      const { error: upsertError } = await supabase
        .from("documentos")
        .upsert(conCufe, { onConflict: "cufe", ignoreDuplicates: false });

      if (upsertError) {
        // El constraint único no existe aún — borrar los que ya existan con esos CUFEs e insertar
        const cufesNuevos = conCufe.map((d) => d.cufe as string);
        await supabase
          .from("documentos")
          .delete()
          .eq("cliente_id", clienteId)
          .in("cufe", cufesNuevos);

        const { error: insertError } = await supabase.from("documentos").insert(conCufe);
        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    if (sinCufe.length > 0) {
      const { error } = await supabase.from("documentos").insert(sinCufe);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok:       true,
      total:    documentos.length,
      emitidos: documentos.filter((d) => d.grupo === "Emitido").length,
      recibidos:documentos.filter((d) => d.grupo === "Recibido").length,
    });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function parsearFecha(valor: unknown): string | null {
  if (!valor) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  const v = String(valor).trim();
  const m1 = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m1) {
    const [, d, mo, a] = m1;
    return `${a.length === 2 ? "20" + a : a}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const m2 = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}
