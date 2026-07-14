"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UvtVigente({
  valorInicial, anioInicial, actualizadoEn,
}: {
  valorInicial: number;
  anioInicial: number;
  actualizadoEn: string | null;
}) {
  const router = useRouter();
  const [valor, setValor] = useState(String(valorInicial));
  const [anio, setAnio] = useState(String(anioInicial));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    setError("");
    setGuardando(true);
    const res = await fetch("/api/configuracion/uvt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor, anio }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      setGuardando(false);
      return;
    }
    setGuardando(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
      <h3 className="font-serif font-semibold mb-1" style={{ color: "#1A1814" }}>UVT vigente</h3>
      <p className="text-xs mb-3" style={{ color: "#9A9281" }}>
        Se usa para calcular las bases mínimas en pesos de Retención en la Fuente.
        {actualizadoEn && ` Última actualización: ${new Date(actualizadoEn).toLocaleDateString("es-CO")}.`}
      </p>
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Valor UVT ($)</label>
          <input type="number" value={valor} onChange={(e) => setValor(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border w-40" style={{ borderColor: "#E8E1D4" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Año</label>
          <input type="number" value={anio} onChange={(e) => setAnio(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border w-24" style={{ borderColor: "#E8E1D4" }} />
        </div>
        <button onClick={guardar} disabled={guardando}
          className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}>
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {error && <p className="text-xs mt-2" style={{ color: "#9E4332" }}>{error}</p>}
    </div>
  );
}
