import GraficaIVA from "./GraficaIVA";

const fmt = (n: number) =>
  "$ " + Math.round(Math.abs(n)).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fechaLarga = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
};

type Detalle = {
  facturas_venta?: number; notas_credito_venta?: number; notas_debito_venta?: number;
  facturas_compra?: number; notas_credito_compra?: number; notas_debito_compra?: number;
  saldo_periodo?: number;
  saldo_anterior_arrastrado?: number;
  saldo_anterior_origen?: string | null;
  periodo_anterior?: string | null;
  reteiva_total?: number;
  reteiva_certificados?: number;
  periodo_oficial_fin?: string;
} | null;

export default function ReporteIVA({
  clienteNombre, periodoInicio, periodoFin, ivaGenerado, ivaDescontable, saldoFinal, detalle, fechaLiquidacion, esFinal,
}: {
  clienteNombre: string;
  periodoInicio: string;
  periodoFin: string;
  ivaGenerado: number;
  ivaDescontable: number;
  saldoFinal: number;
  detalle: Detalle;
  fechaLiquidacion: string;
  esFinal: boolean;
}) {
  const d = detalle ?? {};
  const saldoPeriodo = d.saldo_periodo ?? (ivaGenerado - ivaDescontable);
  const arrastre = d.saldo_anterior_arrastrado ?? 0;
  const reteiva = d.reteiva_total ?? 0;

  const partes: string[] = [];
  partes.push(
    esFinal
      ? `Durante el periodo del ${fechaLarga(periodoInicio)} al ${fechaLarga(periodoFin)}, ${clienteNombre} generó un IVA de ${fmt(ivaGenerado)} sobre sus ventas y un IVA descontable de ${fmt(ivaDescontable)} sobre sus compras, para un saldo del periodo ${saldoPeriodo >= 0 ? `a pagar de ${fmt(saldoPeriodo)}` : `a favor de ${fmt(saldoPeriodo)}`}.`
      : `A corte del ${fechaLarga(periodoFin)} (informe parcial de control dentro del periodo del ${fechaLarga(periodoInicio)} al ${fechaLarga(detalle?.periodo_oficial_fin ?? periodoFin)}), ${clienteNombre} acumula un IVA de ${fmt(ivaGenerado)} sobre sus ventas y un IVA descontable de ${fmt(ivaDescontable)} sobre sus compras, para un saldo ${saldoPeriodo >= 0 ? `a pagar de ${fmt(saldoPeriodo)}` : `a favor de ${fmt(saldoPeriodo)}`} a la fecha.`
  );
  if (arrastre > 0) {
    partes.push(
      `Se cruzó un saldo a favor de ${fmt(arrastre)}${d.periodo_anterior ? ` correspondiente al periodo anterior (${d.periodo_anterior})` : " de un periodo anterior"}.`
    );
  }
  if (reteiva > 0) {
    partes.push(
      `Se descontaron ${fmt(reteiva)} en certificados de Retención de IVA${d.reteiva_certificados ? ` (${d.reteiva_certificados} certificado${d.reteiva_certificados > 1 ? "s" : ""})` : ""}.`
    );
  }
  partes.push(
    esFinal
      ? (saldoFinal >= 0
          ? `El valor final a pagar por este periodo es de ${fmt(saldoFinal)}.`
          : `El resultado final es un saldo a favor de ${fmt(saldoFinal)}, disponible para cruzar en el siguiente periodo.`)
      : (saldoFinal >= 0
          ? `El valor a pagar acumulado a la fecha de corte es de ${fmt(saldoFinal)}, sujeto a variar hasta el cierre del periodo.`
          : `El saldo a favor acumulado a la fecha de corte es de ${fmt(saldoFinal)}, sujeto a variar hasta el cierre del periodo.`)
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs uppercase tracking-wide font-medium" style={{ color: "#9A7223" }}>
            Reporte de liquidación de IVA
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
            backgroundColor: esFinal ? "#E7F0E4" : "#F5EEDF",
            color:           esFinal ? "#3B6D2E" : "#9A7223",
          }}>
            {esFinal ? "Informe final" : "Informe parcial"}
          </span>
        </div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>{clienteNombre}</h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          {esFinal ? "Periodo" : "Corte"} {fechaLarga(periodoInicio)} — {fechaLarga(periodoFin)} · Liquidado el {fechaLarga(fechaLiquidacion.slice(0, 10))}
          {!esFinal && detalle?.periodo_oficial_fin && ` · Periodo oficial hasta el ${fechaLarga(detalle.periodo_oficial_fin)}`}
        </p>
      </div>

      {/* Resumen numérico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "IVA generado",    valor: ivaGenerado,    color: "#3B6D2E" },
          { label: "IVA descontable", valor: ivaDescontable, color: "#9A7223" },
          ...(arrastre > 0 ? [{ label: "Saldo a favor cruzado", valor: arrastre, color: "#3B6D2E" }] : []),
          ...(reteiva > 0 ? [{ label: "ReteIVA descontada", valor: reteiva, color: "#3B6D2E" }] : []),
        ].map((item) => (
          <div key={item.label} className="rounded-xl border p-4" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
            <p className="text-xs mb-1" style={{ color: "#9A9281" }}>{item.label}</p>
            <p className="font-serif text-lg font-bold" style={{ color: item.color }}>{fmt(item.valor)}</p>
          </div>
        ))}
      </div>

      {/* Saldo final destacado */}
      <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "#1A1814", borderColor: "#1A1814" }}>
        <p className="text-xs mb-1" style={{ color: "#C0A36B" }}>
          {saldoFinal >= 0 ? "Valor final a pagar" : "Saldo final a favor"}
        </p>
        <p className="font-serif text-3xl font-bold" style={{ color: "#FAF8F4" }}>{fmt(saldoFinal)}</p>
      </div>

      {/* Gráfica */}
      <div className="mb-6">
        <GraficaIVA
          facturas_venta={d.facturas_venta ?? 0}
          notas_credito_venta={d.notas_credito_venta ?? 0}
          notas_debito_venta={d.notas_debito_venta ?? 0}
          facturas_compra={d.facturas_compra ?? 0}
          notas_credito_compra={d.notas_credito_compra ?? 0}
          notas_debito_compra={d.notas_debito_compra ?? 0}
        />
      </div>

      {/* Resumen profesional */}
      <div className="rounded-xl border p-5" style={{ backgroundColor: "#FDFBF7", borderColor: "#E8E1D4" }}>
        <h3 className="font-serif font-semibold mb-2" style={{ color: "#1A1814" }}>Resumen del resultado</h3>
        <div className="space-y-2 text-sm" style={{ color: "#2A2620" }}>
          {partes.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  );
}
