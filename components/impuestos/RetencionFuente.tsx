"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generarPeriodosMensuales, esDocumentoSoporte, type ConceptoReteFuente } from "@/lib/reglas-tributarias";
import ImportarPapelTrabajo from "./ImportarPapelTrabajo";

type Documento = {
  id: string;
  tipo_documento: string | null;
  grupo: "Emitido" | "Recibido";
  fecha_emision: string | null;
  nit_emisor: string | null;
  nombre_emisor: string | null;
  base: number | null;
  numero_documento: string | null;
};

type Retencion = {
  id: string;
  documento_id: string;
  periodo_inicio: string;
  periodo_fin: string;
  concepto: string;
  tarifa: number;
  base: number;
  valor_retenido: number;
  created_at: string;
};

const fmt = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const anioActual = new Date().getFullYear();
const ANIOS = [anioActual - 1, anioActual, anioActual + 1];

function FilaPendiente({
  doc, clienteId, periodoInicio, periodoFin, conceptos, uvtValor, onGuardado,
}: {
  doc: Documento;
  clienteId: string;
  periodoInicio: string;
  periodoFin: string;
  conceptos: ConceptoReteFuente[];
  uvtValor: number;
  onGuardado: () => void;
}) {
  const [conceptoId, setConceptoId] = useState(conceptos[0]?.id ?? "");
  const [tarifaStr, setTarifaStr] = useState(String(conceptos[0]?.tarifa ?? 0));
  const [baseStr, setBaseStr] = useState(String(doc.base ?? 0));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const tarifa = parseFloat(tarifaStr) || 0;
  const base = parseFloat(baseStr) || 0;
  const valor = Math.round(base * (tarifa / 100));

  const conceptoActivo = conceptos.find((c) => c.id === conceptoId);
  const baseMinimaPesos = (conceptoActivo?.base_uvt ?? 0) * uvtValor;
  const bajoElTope = baseMinimaPesos > 0 && base < baseMinimaPesos;

  function cambiarConcepto(id: string) {
    setConceptoId(id);
    const c = conceptos.find((x) => x.id === id);
    if (c) setTarifaStr(String(c.tarifa));
  }

  async function aplicar() {
    setError("");
    setGuardando(true);
    const res = await fetch("/api/impuestos/retefuente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        documento_id: doc.id,
        periodo_inicio: periodoInicio,
        periodo_fin: periodoFin,
        concepto: conceptoActivo?.concepto ?? "",
        tarifa,
        base,
        valor_retenido: valor,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      setGuardando(false);
      return;
    }
    onGuardado();
  }

  return (
    <tr style={{ borderBottom: "1px solid #EFEADF" }}>
      <td className="px-3 py-2 text-xs" style={{ color: "#2A2620" }}>{doc.fecha_emision ?? "—"}</td>
      <td className="px-3 py-2 text-xs" style={{ color: "#2A2620" }}>
        {doc.nombre_emisor ?? "—"} <span style={{ color: "#9A9281" }}>({doc.nit_emisor ?? "—"})</span>
        {doc.grupo === "Emitido" && (
          <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}>
            doc. soporte
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <select value={conceptoId} onChange={(e) => cambiarConcepto(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border w-full" style={{ borderColor: "#E8E1D4" }}>
          {conceptos.map((c) => <option key={c.id} value={c.id}>{c.concepto}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input type="number" value={baseStr} onChange={(e) => setBaseStr(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border w-24" style={{ borderColor: bajoElTope ? "#E8C9C0" : "#E8E1D4" }} />
        {bajoElTope && (
          <p className="text-xs mt-1" style={{ color: "#9E4332" }}>
            ⚠ Bajo el tope ({conceptoActivo?.base_uvt} UVT = {fmt(baseMinimaPesos)})
          </p>
        )}
      </td>
      <td className="px-3 py-2">
        <input type="number" value={tarifaStr} onChange={(e) => setTarifaStr(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border w-16" style={{ borderColor: "#E8E1D4" }} />
        <span className="text-xs ml-0.5" style={{ color: "#9A9281" }}>%</span>
      </td>
      <td className="px-3 py-2 text-xs text-right font-medium" style={{ color: "#1A1814" }}>{fmt(valor)}</td>
      <td className="px-3 py-2">
        <button onClick={aplicar} disabled={guardando}
          className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}>
          {guardando ? "..." : "Aplicar"}
        </button>
        {error && <p className="text-xs mt-1" style={{ color: "#9E4332" }}>{error}</p>}
      </td>
    </tr>
  );
}

export default function RetencionFuente({
  clienteId, documentos, nitsAutorretenedores, retenciones, conceptos, uvtValor,
}: {
  clienteId: string;
  documentos: Documento[];
  nitsAutorretenedores: string[];
  retenciones: Retencion[];
  conceptos: ConceptoReteFuente[];
  uvtValor: number;
}) {
  const router = useRouter();
  const [anio, setAnio] = useState(anioActual);
  const [mesIdx, setMesIdx] = useState(new Date().getMonth());

  const periodos = useMemo(() => generarPeriodosMensuales(anio), [anio]);
  const periodo = periodos[mesIdx];

  const candidatos = useMemo(() => {
    const nits = new Set(nitsAutorretenedores);
    return documentos.filter((d) => {
      const esCompra = d.grupo === "Recibido" || (d.grupo === "Emitido" && esDocumentoSoporte(d.tipo_documento ?? ""));
      if (!esCompra) return false;
      if (!d.fecha_emision || d.fecha_emision < periodo.inicio || d.fecha_emision > periodo.fin) return false;
      if (d.nit_emisor && nits.has(d.nit_emisor)) return false;
      return true;
    });
  }, [documentos, periodo, nitsAutorretenedores]);

  const aplicadasDelPeriodo = useMemo(
    () => retenciones.filter((r) => r.periodo_inicio === periodo.inicio && r.periodo_fin === periodo.fin),
    [retenciones, periodo]
  );

  const idsAplicados = new Set(aplicadasDelPeriodo.map((r) => r.documento_id));
  const pendientes = candidatos.filter((d) => !idsAplicados.has(d.id));
  const excluidosAutorretenedor = documentos.filter((d) => {
    const esCompra = d.grupo === "Recibido" || (d.grupo === "Emitido" && esDocumentoSoporte(d.tipo_documento ?? ""));
    return esCompra && d.fecha_emision && d.fecha_emision >= periodo.inicio && d.fecha_emision <= periodo.fin
      && d.nit_emisor && nitsAutorretenedores.includes(d.nit_emisor);
  }).length;

  const totalRetenido = aplicadasDelPeriodo.reduce((acc, r) => acc + r.valor_retenido, 0);

  async function eliminar(id: string) {
    if (!confirm("¿Quitar esta retención aplicada?")) return;
    await fetch(`/api/impuestos/retefuente/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      {/* Selector de periodo */}
      <div className="rounded-xl border p-5 mb-6 flex flex-wrap items-end gap-4" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#9A9281" }}>Año</label>
          <select value={anio} onChange={(e) => setAnio(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4", color: "#1A1814" }}>
            {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#9A9281" }}>Mes</label>
          <select value={mesIdx} onChange={(e) => setMesIdx(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4", color: "#1A1814" }}>
            {periodos.map((p, i) => <option key={p.inicio} value={i}>{p.etiqueta}</option>)}
          </select>
        </div>
        <span className="text-xs" style={{ color: "#9A9281" }}>
          {pendientes.length} pendientes por revisar
          {excluidosAutorretenedor > 0 && ` · ${excluidosAutorretenedor} excluidos por ser autorretenedores`}
        </span>
      </div>

      <ImportarPapelTrabajo clienteId={clienteId} periodoInicio={periodo.inicio} periodoFin={periodo.fin} />

      {/* Pendientes por asignar */}
      {pendientes.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif font-semibold mb-3" style={{ color: "#1A1814" }}>Pendientes por revisar</h2>
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                  {["Fecha", "Tercero", "Concepto", "Base", "Tarifa", "Valor", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold" style={{ color: "#9A9281" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendientes.map((d) => (
                  <FilaPendiente
                    key={d.id}
                    doc={d}
                    clienteId={clienteId}
                    periodoInicio={periodo.inicio}
                    periodoFin={periodo.fin}
                    conceptos={conceptos}
                    uvtValor={uvtValor}
                    onGuardado={() => router.refresh()}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Retenciones aplicadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif font-semibold" style={{ color: "#1A1814" }}>Retenciones aplicadas — {periodo.etiqueta}</h2>
          <span className="font-serif text-lg font-bold" style={{ color: "#9E4332" }}>Total {fmt(totalRetenido)}</span>
        </div>
        {aplicadasDelPeriodo.length === 0 ? (
          <div className="rounded-xl border py-10 text-center" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
            <p className="text-sm" style={{ color: "#9A9281" }}>Sin retenciones aplicadas en este periodo todavía.</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                  {["NIT", "Nombre / Razón social", "Fecha factura", "N° factura", "Base", "Concepto", "Tarifa", "Valor retenido", ""].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold" style={{ color: "#9A9281" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aplicadasDelPeriodo.map((r, i) => {
                  const doc = documentos.find((d) => d.id === r.documento_id);
                  return (
                    <tr key={r.id} style={{ borderBottom: i < aplicadasDelPeriodo.length - 1 ? "1px solid #EFEADF" : "none" }}>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "#2A2620" }}>{doc?.nit_emisor ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "#2A2620" }}>{doc?.nombre_emisor ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "#2A2620" }}>{doc?.fecha_emision ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "#9A9281" }}>{doc?.numero_documento ?? "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-right" style={{ color: "#2A2620" }}>{fmt(r.base)}</td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: "#2A2620" }}>{r.concepto}</td>
                      <td className="px-3 py-2.5 text-xs text-right" style={{ color: "#2A2620" }}>{r.tarifa}%</td>
                      <td className="px-3 py-2.5 text-xs text-right font-medium" style={{ color: "#9E4332" }}>{fmt(r.valor_retenido)}</td>
                      <td className="px-3 py-2.5 text-xs">
                        <button onClick={() => eliminar(r.id)} style={{ color: "#9E4332" }}>Quitar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
