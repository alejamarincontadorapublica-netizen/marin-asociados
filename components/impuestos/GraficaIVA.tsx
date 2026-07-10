"use client";

import { useState } from "react";

type Fila = { categoria: string; ventas: number; compras: number };

const fmt = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const VENTAS_COLOR  = "#3B6D2E";
const COMPRAS_COLOR = "#9A7223";

function Barra({ valor, max, color, etiqueta }: { valor: number; max: number; color: string; etiqueta: string }) {
  const [activa, setActiva] = useState(false);
  const ancho = max > 0 ? Math.max((valor / max) * 100, valor > 0 ? 3 : 0) : 0;

  return (
    <div className="flex items-center gap-3 mb-1.5">
      <div
        className="flex-1 h-5 rounded-lg overflow-hidden"
        style={{ backgroundColor: "#F0EEEA" }}
        onMouseEnter={() => setActiva(true)}
        onMouseLeave={() => setActiva(false)}
        role="img"
        aria-label={`${etiqueta}: ${fmt(valor)}`}
      >
        <div
          className="h-full rounded-lg transition-opacity"
          style={{
            width: `${ancho}%`,
            backgroundColor: color,
            opacity: activa ? 0.85 : 1,
          }}
        />
      </div>
      <span
        className="text-xs font-medium w-32 text-right shrink-0 tabular-nums"
        style={{ color: "#1A1814" }}
      >
        {fmt(valor)}
      </span>
    </div>
  );
}

export default function GraficaIVA({
  facturas_venta, notas_credito_venta, notas_debito_venta,
  facturas_compra, notas_credito_compra, notas_debito_compra,
}: {
  facturas_venta: number; notas_credito_venta: number; notas_debito_venta: number;
  facturas_compra: number; notas_credito_compra: number; notas_debito_compra: number;
}) {
  const filas: Fila[] = [
    { categoria: "Facturas",       ventas: facturas_venta,       compras: facturas_compra },
    { categoria: "Notas crédito",  ventas: notas_credito_venta,  compras: notas_credito_compra },
    { categoria: "Notas débito",   ventas: notas_debito_venta,   compras: notas_debito_compra },
  ];

  const max = Math.max(1, ...filas.flatMap((f) => [f.ventas, f.compras]));

  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
          IVA por tipo de documento
        </h3>
        <div className="flex items-center gap-4 text-xs" style={{ color: "#1A1814" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: VENTAS_COLOR }} />
            Ventas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COMPRAS_COLOR }} />
            Compras
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {filas.map((f) => (
          <div key={f.categoria}>
            <p className="text-xs font-medium mb-1.5" style={{ color: "#9A9281" }}>{f.categoria}</p>
            <Barra valor={f.ventas}  max={max} color={VENTAS_COLOR}  etiqueta={`${f.categoria} · Ventas`} />
            <Barra valor={f.compras} max={max} color={COMPRAS_COLOR} etiqueta={`${f.categoria} · Compras`} />
          </div>
        ))}
      </div>

      {/* Tabla accesible con los mismos valores */}
      <table className="w-full text-xs mt-5 pt-4" style={{ borderTop: "1px solid #EFEADF" }}>
        <caption className="sr-only">Detalle de IVA por tipo de documento, ventas y compras</caption>
        <thead>
          <tr>
            <th className="text-left py-1" style={{ color: "#9A9281" }}>Tipo</th>
            <th className="text-right py-1" style={{ color: "#9A9281" }}>Ventas</th>
            <th className="text-right py-1" style={{ color: "#9A9281" }}>Compras</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.categoria}>
              <td className="py-1" style={{ color: "#2A2620" }}>{f.categoria}</td>
              <td className="py-1 text-right tabular-nums" style={{ color: "#2A2620" }}>{fmt(f.ventas)}</td>
              <td className="py-1 text-right tabular-nums" style={{ color: "#2A2620" }}>{fmt(f.compras)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
