"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Concepto = {
  id: string;
  concepto: string;
  base_uvt: number;
  tarifa: number;
  activo: boolean;
  updated_at: string;
};

function FilaConcepto({ c, onCambio }: { c: Concepto; onCambio: () => void }) {
  const [concepto, setConcepto] = useState(c.concepto);
  const [baseUvt, setBaseUvt] = useState(String(c.base_uvt));
  const [tarifa, setTarifa] = useState(String(c.tarifa));
  const [activo, setActivo] = useState(c.activo);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    await fetch(`/api/configuracion/conceptos-retefuente/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        concepto,
        base_uvt: parseFloat(baseUvt) || 0,
        tarifa: parseFloat(tarifa) || 0,
        activo,
      }),
    });
    setGuardando(false);
    onCambio();
  }

  async function eliminar() {
    if (!confirm(`¿Eliminar el concepto "${c.concepto}"?`)) return;
    await fetch(`/api/configuracion/conceptos-retefuente/${c.id}`, { method: "DELETE" });
    onCambio();
  }

  return (
    <tr style={{ borderBottom: "1px solid #EFEADF" }}>
      <td className="px-3 py-2">
        <input value={concepto} onChange={(e) => setConcepto(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border w-full" style={{ borderColor: "#E8E1D4" }} />
      </td>
      <td className="px-3 py-2">
        <input type="number" value={baseUvt} onChange={(e) => setBaseUvt(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border w-20" style={{ borderColor: "#E8E1D4" }} />
      </td>
      <td className="px-3 py-2">
        <input type="number" value={tarifa} onChange={(e) => setTarifa(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border w-16" style={{ borderColor: "#E8E1D4" }} />
        <span className="text-xs ml-0.5" style={{ color: "#9A9281" }}>%</span>
      </td>
      <td className="px-3 py-2">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
      </td>
      <td className="px-3 py-2 text-xs" style={{ color: "#9A9281" }}>
        {new Date(c.updated_at).toLocaleDateString("es-CO")}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <button onClick={guardar} disabled={guardando}
          className="text-xs px-2.5 py-1 rounded-lg font-medium mr-2 disabled:opacity-60"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}>
          {guardando ? "..." : "Guardar"}
        </button>
        <button onClick={eliminar} className="text-xs" style={{ color: "#9E4332" }}>Eliminar</button>
      </td>
    </tr>
  );
}

export default function ConceptosRetefuente({ conceptos }: { conceptos: Concepto[] }) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [concepto, setConcepto] = useState("");
  const [baseUvt, setBaseUvt] = useState("0");
  const [tarifa, setTarifa] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const ultimaActualizacion = conceptos.reduce<string | null>(
    (max, c) => (!max || c.updated_at > max ? c.updated_at : max), null
  );

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!concepto.trim() || !tarifa) { setError("Concepto y tarifa son obligatorios."); return; }

    setGuardando(true);
    const res = await fetch("/api/configuracion/conceptos-retefuente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concepto: concepto.trim(), base_uvt: parseFloat(baseUvt) || 0, tarifa: parseFloat(tarifa) }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      setGuardando(false);
      return;
    }
    setConcepto(""); setBaseUvt("0"); setTarifa("");
    setGuardando(false);
    setMostrarForm(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
            Conceptos y tarifas de Retención en la Fuente
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
            {ultimaActualizacion
              ? `Tabla actualizada por última vez el ${new Date(ultimaActualizacion).toLocaleDateString("es-CO")}`
              : "Sin conceptos registrados"}
          </p>
        </div>
        <button onClick={() => setMostrarForm((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}>
          {mostrarForm ? "Cancelar" : "+ Nuevo concepto"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={agregar} className="rounded-xl border p-4 mb-4 grid grid-cols-4 gap-3 items-end" style={{ backgroundColor: "#FDFBF7", borderColor: "#E8E1D4" }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Concepto *</label>
            <input value={concepto} onChange={(e) => setConcepto(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Base mínima (UVT)</label>
            <input type="number" value={baseUvt} onChange={(e) => setBaseUvt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Tarifa (%) *</label>
            <input type="number" value={tarifa} onChange={(e) => setTarifa(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <button type="submit" disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}>
            {guardando ? "Guardando..." : "Agregar"}
          </button>
          {error && (
            <p className="col-span-4 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
              {error}
            </p>
          )}
        </form>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
              {["Concepto", "Base (UVT)", "Tarifa", "Activo", "Actualizado", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold" style={{ color: "#9A9281" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conceptos.map((c) => (
              <FilaConcepto key={c.id} c={c} onCambio={() => router.refresh()} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
