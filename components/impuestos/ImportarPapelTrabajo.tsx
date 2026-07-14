"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fmt = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

type Resultado = {
  aplicadas: number;
  totalRetenido: number;
  omitidas: { cufe: string; motivo: string }[];
};

export default function ImportarPapelTrabajo({
  clienteId, periodoInicio, periodoFin,
}: {
  clienteId: string;
  periodoInicio: string;
  periodoFin: string;
}) {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function subir() {
    if (!archivo) return;
    setError("");
    setResultado(null);
    setCargando(true);

    const fd = new FormData();
    fd.append("cliente_id", clienteId);
    fd.append("periodo_inicio", periodoInicio);
    fd.append("periodo_fin", periodoFin);
    fd.append("archivo", archivo);

    const res = await fetch("/api/impuestos/retefuente/importar", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al importar el archivo.");
      setCargando(false);
      return;
    }

    setResultado(data);
    setCargando(false);
    setArchivo(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "#F5EEDF", borderColor: "#E8D9B8" }}>
      <h3 className="font-serif font-semibold mb-1" style={{ color: "#1A1814" }}>
        Subir papel de trabajo de retenciones (Excel)
      </h3>
      <p className="text-xs mb-3" style={{ color: "#6B4F2A" }}>
        Toma la retención ya calculada por factura (columna "RTE FTE") y la aplica automáticamente,
        emparejando cada fila por CUFE con los documentos ya sincronizados en Facturación DIAN.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <button
          onClick={subir}
          disabled={!archivo || cargando}
          className="text-xs px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
          style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}
        >
          {cargando ? "Importando..." : "Importar"}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-3 rounded-lg px-3 py-2" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
          {error}
        </p>
      )}

      {resultado && (
        <div className="mt-3 text-xs" style={{ color: "#1A1814" }}>
          <p className="font-medium">
            {resultado.aplicadas} retenciones aplicadas — total {fmt(resultado.totalRetenido)}
          </p>
          {resultado.omitidas.length > 0 && (
            <div className="mt-2">
              <p className="font-medium" style={{ color: "#9E4332" }}>
                {resultado.omitidas.length} filas omitidas:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-0.5" style={{ color: "#9E4332" }}>
                {resultado.omitidas.slice(0, 10).map((o, i) => (
                  <li key={i}>CUFE ...{o.cufe.slice(-8)}: {o.motivo}</li>
                ))}
                {resultado.omitidas.length > 10 && <li>y {resultado.omitidas.length - 10} más...</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
