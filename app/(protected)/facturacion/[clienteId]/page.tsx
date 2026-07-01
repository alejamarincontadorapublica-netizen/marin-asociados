import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { calcularIVA } from "@/lib/reglas-tributarias";

type Params = Promise<{ clienteId: string }>;

const fmt = (n: number) =>
  "$ " + n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default async function DocumentosClientePage({ params }: { params: Params }) {
  const { clienteId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (error || !cliente) notFound();

  const { data: documentos } = await supabase
    .from("documentos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("fecha_emision", { ascending: false });

  const docs = documentos ?? [];
  const docsParaCalculo = docs
    .filter((d) => d.clasificacion !== "IGNORAR")
    .map((d) => ({
      clasificacion: d.clasificacion,
      grupo: d.grupo,
      iva: d.iva ?? 0,
      factura_aiu: cliente.factura_aiu ?? false,
      porcentaje_aiu: cliente.porcentaje_aiu ?? 0,
    }));

  const { iva_generado, iva_descontable, saldo, detalle } =
    docsParaCalculo.length > 0
      ? calcularIVA(docsParaCalculo)
      : { iva_generado: 0, iva_descontable: 0, saldo: 0, detalle: null };

  const emitidos  = docs.filter((d) => d.grupo === "Emitido");
  const recibidos = docs.filter((d) => d.grupo === "Recibido");

  const clasColor: Record<string, { bg: string; tx: string }> = {
    FACTURA:      { bg: "#E7F0E4", tx: "#3B6D2E" },
    NOTA_CREDITO: { bg: "#F6E9E6", tx: "#9E4332" },
    NOTA_DEBITO:  { bg: "#F5EEDF", tx: "#9A7223" },
    IGNORAR:      { bg: "#F0EEEA", tx: "#9A9281" },
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/facturacion" className="text-xs mb-3 inline-block" style={{ color: "#9A7223" }}>
            ← Volver a facturación
          </Link>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
            {cliente.nombre}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
            {docs.length} documentos · {emitidos.length} emitidos · {recibidos.length} recibidos
          </p>
        </div>
        <Link
          href={`/facturacion/${clienteId}/sincronizar`}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
        >
          Sincronizar DIAN
        </Link>
      </div>

      {/* Resumen IVA */}
      {docs.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "IVA generado neto",    valor: iva_generado,    color: "#3B6D2E", bg: "#E7F0E4" },
            { label: "IVA descontable neto",  valor: iva_descontable, color: "#9A7223", bg: "#F5EEDF" },
            { label: saldo >= 0 ? "IVA a pagar" : "Saldo a favor",
              valor: Math.abs(saldo),
              color: saldo >= 0 ? "#9E4332" : "#3B6D2E",
              bg:    saldo >= 0 ? "#F6E9E6" : "#E7F0E4" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-4"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
            >
              <p className="text-xs mb-1" style={{ color: "#9A9281" }}>{item.label}</p>
              <p
                className="font-serif text-xl font-bold"
                style={{ color: item.color }}
              >
                {fmt(item.valor)}
              </p>
              {cliente.factura_aiu && item.label.includes("descontable") && (
                <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
                  Prorrateo AIU {cliente.porcentaje_aiu}% aplicado
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabla de documentos */}
      {docs.length === 0 ? (
        <div
          className="rounded-xl border py-16 text-center"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
        >
          <p className="font-serif text-lg mb-2" style={{ color: "#1A1814" }}>Sin documentos</p>
          <p className="text-sm mb-4" style={{ color: "#9A9281" }}>
            Sincroniza los documentos de este cliente desde la DIAN
          </p>
          <Link
            href={`/facturacion/${clienteId}/sincronizar`}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
          >
            Sincronizar ahora
          </Link>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                {["Fecha", "Tipo", "Emisor / Receptor", "Base", "IVA", "Total", "Grupo", "Clasificación"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold tracking-wide" style={{ color: "#9A9281" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => {
                const cc = clasColor[d.clasificacion] ?? clasColor["IGNORAR"];
                return (
                  <tr key={d.id} style={{ borderBottom: i < docs.length - 1 ? "1px solid #EFEADF" : "none" }}>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "#2A2620" }}>
                      {d.fecha_emision ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "#9A9281" }}>
                      {d.tipo_documento ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "#2A2620" }}>
                      {d.nombre_emisor ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-right" style={{ color: "#2A2620" }}>
                      {d.base != null ? fmt(d.base) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-right font-medium" style={{ color: "#1A1814" }}>
                      {d.iva != null ? fmt(d.iva) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-right" style={{ color: "#2A2620" }}>
                      {d.total != null ? fmt(d.total) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: d.grupo === "Emitido" ? "#E7F0E4" : "#F5EEDF",
                          color: d.grupo === "Emitido" ? "#3B6D2E" : "#9A7223",
                        }}
                      >
                        {d.grupo}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cc.bg, color: cc.tx }}>
                        {d.clasificacion}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
