"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calcularIVA, generarPeriodosFiscales, type Periodicidad } from "@/lib/reglas-tributarias";
import CertificadosReteIVA, { type CertificadoReteIVA } from "./CertificadosReteIVA";

type Documento = {
  fecha_emision: string | null;
  iva: number | null;
  grupo: "Emitido" | "Recibido";
  clasificacion: "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "IGNORAR";
  aiu_porcentaje: number | null;
};

type Liquidacion = {
  id: string;
  periodo_inicio: string;
  periodo_fin: string;
  iva_generado: number;
  iva_descontable: number;
  saldo: number;
  detalle: Record<string, unknown> | null;
  created_at: string;
};

type CertificadoConPeriodo = CertificadoReteIVA & { periodo_inicio: string; periodo_fin: string };

const fmt = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const anioActual = new Date().getFullYear();
const ANIOS = [anioActual - 1, anioActual, anioActual + 1];

export default function LiquidacionIVA({
  clienteId, periodicidad, facturaAiu, porcentajeAiuDefecto, documentos, liquidaciones, certificados,
}: {
  clienteId: string;
  periodicidad: Periodicidad;
  facturaAiu: boolean;
  porcentajeAiuDefecto: number;
  documentos: Documento[];
  liquidaciones: Liquidacion[];
  certificados: CertificadoConPeriodo[];
}) {
  const router = useRouter();
  const [anio, setAnio] = useState(anioActual);
  const [periodoIdx, setPeriodoIdx] = useState(0);
  const [arrastrar, setArrastrar] = useState(false);
  const [montoArrastreStr, setMontoArrastreStr] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const periodos = useMemo(() => generarPeriodosFiscales(periodicidad, anio), [periodicidad, anio]);
  const periodo = periodos[periodoIdx] ?? periodos[0];

  const docsDelPeriodo = useMemo(
    () =>
      documentos.filter(
        (d) =>
          d.clasificacion !== "IGNORAR" &&
          d.fecha_emision &&
          d.fecha_emision >= periodo.inicio &&
          d.fecha_emision <= periodo.fin
      ),
    [documentos, periodo]
  );

  const { iva_generado, iva_descontable, saldo, detalle } = useMemo(() => {
    if (docsDelPeriodo.length === 0) {
      return { iva_generado: 0, iva_descontable: 0, saldo: 0, detalle: null as Record<string, number> | null };
    }
    return calcularIVA(
      docsDelPeriodo.map((d) => ({
        clasificacion: d.clasificacion,
        grupo: d.grupo,
        iva: d.iva ?? 0,
        factura_aiu: facturaAiu,
        porcentaje_aiu: d.aiu_porcentaje ?? porcentajeAiuDefecto,
      }))
    );
  }, [docsDelPeriodo, facturaAiu, porcentajeAiuDefecto]);

  // Liquidación guardada más reciente cuyo periodo termina antes de que empiece el actual
  const liquidacionAnterior = useMemo(() => {
    return liquidaciones
      .filter((l) => l.periodo_fin < periodo.inicio)
      .sort((a, b) => (a.periodo_fin < b.periodo_fin ? 1 : -1))[0] ?? null;
  }, [liquidaciones, periodo]);

  const saldoAnterior = liquidacionAnterior?.saldo ?? 0;
  const hayArrastreDetectado = !!liquidacionAnterior && saldoAnterior < 0;

  // Al cambiar de periodo, pre-llenar con el saldo a favor detectado por el sistema (si existe)
  useEffect(() => {
    if (hayArrastreDetectado) {
      setArrastrar(true);
      setMontoArrastreStr(String(Math.abs(saldoAnterior)));
    } else {
      setArrastrar(false);
      setMontoArrastreStr("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo.inicio, periodo.fin]);

  const montoArrastre = parseFloat(montoArrastreStr) || 0;
  const saldoConArrastre = arrastrar ? saldo - montoArrastre : saldo;

  const certificadosDelPeriodo = useMemo(
    () => certificados.filter((c) => c.periodo_inicio === periodo.inicio && c.periodo_fin === periodo.fin),
    [certificados, periodo]
  );
  const totalReteIva = certificadosDelPeriodo.reduce((acc, c) => acc + c.monto_retenido, 0);

  const saldoFinal = saldoConArrastre - totalReteIva;

  const yaLiquidado = liquidaciones.find(
    (l) => l.periodo_inicio === periodo.inicio && l.periodo_fin === periodo.fin
  );

  async function guardar() {
    setGuardando(true);
    setMensaje("");

    const res = await fetch("/api/impuestos/liquidar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        periodo_inicio: periodo.inicio,
        periodo_fin: periodo.fin,
        iva_generado,
        iva_descontable,
        saldo: saldoFinal,
        detalle: {
          ...detalle,
          saldo_periodo: saldo,
          saldo_anterior_arrastrado: arrastrar ? montoArrastre : 0,
          saldo_anterior_origen: arrastrar ? (hayArrastreDetectado ? "sistema" : "manual") : null,
          periodo_anterior: liquidacionAnterior
            ? `${liquidacionAnterior.periodo_inicio} a ${liquidacionAnterior.periodo_fin}`
            : null,
          reteiva_total: totalReteIva,
          reteiva_certificados: certificadosDelPeriodo.length,
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMensaje(data.error ?? "Error al guardar la liquidación.");
      setGuardando(false);
      return;
    }

    setGuardando(false);
    router.refresh();
  }

  return (
    <div>
      {/* Selector de periodo */}
      <div
        className="rounded-xl border p-5 mb-6 flex flex-wrap items-end gap-4"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#9A9281" }}>Año</label>
          <select
            value={anio}
            onChange={(e) => { setAnio(parseInt(e.target.value)); setPeriodoIdx(0); }}
            className="px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: "#E8E1D4", color: "#1A1814" }}
          >
            {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "#9A9281" }}>Periodo</label>
          <select
            value={periodoIdx}
            onChange={(e) => setPeriodoIdx(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: "#E8E1D4", color: "#1A1814" }}
          >
            {periodos.map((p, i) => <option key={p.inicio} value={i}>{p.etiqueta}</option>)}
          </select>
        </div>
        <span className="text-xs" style={{ color: "#9A9281" }}>
          {docsDelPeriodo.length} documentos en este periodo
        </span>
        {yaLiquidado && (
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#E7F0E4", color: "#3B6D2E" }}>
            Ya liquidado el {new Date(yaLiquidado.created_at).toLocaleDateString("es-CO")}
          </span>
        )}
      </div>

      {/* Resumen del periodo */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "IVA generado neto",    valor: iva_generado,    color: "#3B6D2E", bg: "#E7F0E4" },
          { label: "IVA descontable neto", valor: iva_descontable, color: "#9A7223", bg: "#F5EEDF" },
          { label: saldo >= 0 ? "Saldo del periodo (a pagar)" : "Saldo del periodo (a favor)",
            valor: Math.abs(saldo),
            color: saldo >= 0 ? "#9E4332" : "#3B6D2E",
            bg:    saldo >= 0 ? "#F6E9E6" : "#E7F0E4" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border p-4" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
            <p className="text-xs mb-1" style={{ color: "#9A9281" }}>{item.label}</p>
            <p className="font-serif text-xl font-bold" style={{ color: item.color }}>{fmt(item.valor)}</p>
          </div>
        ))}
      </div>

      {/* Arrastre de saldo anterior */}
      <div
        className="rounded-xl border p-5 mb-4"
        style={{ backgroundColor: "#F5EEDF", borderColor: "#E8D9B8" }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "#1A1814" }}>
              <input type="checkbox" checked={arrastrar} onChange={(e) => setArrastrar(e.target.checked)} />
              Arrastrar saldo a favor de un periodo anterior
            </label>
            {liquidacionAnterior ? (
              <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
                {hayArrastreDetectado
                  ? `El sistema detectó saldo a favor del periodo anterior (${liquidacionAnterior.periodo_inicio} a ${liquidacionAnterior.periodo_fin}) de ${fmt(Math.abs(saldoAnterior))}. Puedes ajustarlo si es necesario.`
                  : `El periodo anterior liquidado en el sistema (${liquidacionAnterior.periodo_inicio} a ${liquidacionAnterior.periodo_fin}) tuvo saldo a pagar, no a favor. Si igual tienes un saldo a favor de otro periodo (por ejemplo, de antes de usar el sistema), escríbelo abajo.`}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
                Si este cliente tiene saldo a favor de un periodo anterior (incluso de antes de usar el sistema), actívalo y escribe el monto.
              </p>
            )}
          </div>
          {arrastrar && (
            <div className="shrink-0">
              <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Monto a favor a cruzar</label>
              <input
                type="number"
                value={montoArrastreStr}
                onChange={(e) => setMontoArrastreStr(e.target.value)}
                placeholder="0"
                className="w-40 px-3 py-2 rounded-lg text-sm border"
                style={{ borderColor: "#E8D9B8", color: "#1A1814" }}
              />
            </div>
          )}
        </div>
      </div>

      <CertificadosReteIVA
        clienteId={clienteId}
        periodoInicio={periodo.inicio}
        periodoFin={periodo.fin}
        certificados={certificadosDelPeriodo}
      />

      {/* Saldo final */}
      <div
        className="rounded-xl border p-5 mb-6"
        style={{ backgroundColor: "#1A1814", borderColor: "#1A1814" }}
      >
        <p className="text-xs mb-1" style={{ color: "#C0A36B" }}>
          {saldoFinal >= 0 ? "Valor a pagar a la fecha" : "Saldo a favor a la fecha"}
        </p>
        <p className="font-serif text-3xl font-bold" style={{ color: "#FAF8F4" }}>
          {fmt(Math.abs(saldoFinal))}
        </p>
      </div>

      {mensaje && (
        <p className="text-sm rounded-lg px-4 py-2.5 mb-4" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
          {mensaje}
        </p>
      )}

      <button
        onClick={guardar}
        disabled={guardando || docsDelPeriodo.length === 0}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60 mb-8"
        style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
      >
        {guardando ? "Guardando..." : yaLiquidado ? "Actualizar liquidación" : "Guardar liquidación"}
      </button>

      {/* Historial */}
      {liquidaciones.length > 0 && (
        <div>
          <h2 className="font-serif font-semibold mb-3" style={{ color: "#1A1814" }}>Historial de liquidaciones</h2>
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                  {["Periodo", "IVA generado", "IVA descontable", "Saldo final", "Guardado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#9A9281" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < liquidaciones.length - 1 ? "1px solid #EFEADF" : "none" }}>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#2A2620" }}>{l.periodo_inicio} a {l.periodo_fin}</td>
                    <td className="px-4 py-2.5 text-xs text-right" style={{ color: "#2A2620" }}>{fmt(l.iva_generado)}</td>
                    <td className="px-4 py-2.5 text-xs text-right" style={{ color: "#2A2620" }}>{fmt(l.iva_descontable)}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-medium" style={{ color: l.saldo >= 0 ? "#9E4332" : "#3B6D2E" }}>
                      {l.saldo >= 0 ? fmt(l.saldo) + " a pagar" : fmt(Math.abs(l.saldo)) + " a favor"}
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#9A9281" }}>
                      {new Date(l.created_at).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <Link href={`/impuestos/${clienteId}/reporte/${l.id}`} style={{ color: "#9A7223" }}>
                        Ver reporte
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
