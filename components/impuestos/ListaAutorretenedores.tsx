"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tercero = { id: string; nit: string; nombre: string | null; created_at: string };

function FilaTercero({ t, onCambio }: { t: Tercero; onCambio: () => void }) {
  const [editando, setEditando] = useState(false);
  const [nit, setNit] = useState(t.nit);
  const [nombre, setNombre] = useState(t.nombre ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function guardar() {
    setError("");
    if (!nit.trim()) { setError("El NIT es obligatorio."); return; }
    setGuardando(true);
    const res = await fetch(`/api/impuestos/autorretenedores/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nit: nit.trim(), nombre: nombre.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      setGuardando(false);
      return;
    }
    setGuardando(false);
    setEditando(false);
    onCambio();
  }

  async function eliminar() {
    if (!confirm(`¿Quitar ${t.nit} de la lista de autorretenedores?`)) return;
    await fetch(`/api/impuestos/autorretenedores/${t.id}`, { method: "DELETE" });
    onCambio();
  }

  if (editando) {
    return (
      <tr style={{ borderBottom: "1px solid #EFEADF", backgroundColor: "#FDFBF7" }}>
        <td className="px-4 py-2.5">
          <input value={nit} onChange={(e) => setNit(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border w-full" style={{ borderColor: "#E8E1D4" }} />
        </td>
        <td className="px-4 py-2.5">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border w-full" style={{ borderColor: "#E8E1D4" }} />
        </td>
        <td className="px-4 py-2.5 text-xs" style={{ color: "#9A9281" }}>
          {new Date(t.created_at).toLocaleDateString("es-CO")}
        </td>
        <td className="px-4 py-2.5 text-xs whitespace-nowrap">
          <button onClick={guardar} disabled={guardando}
            className="px-2.5 py-1 rounded-lg font-medium mr-2 disabled:opacity-60"
            style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}>
            {guardando ? "..." : "Guardar"}
          </button>
          <button onClick={() => { setEditando(false); setNit(t.nit); setNombre(t.nombre ?? ""); }} style={{ color: "#9A9281" }}>
            Cancelar
          </button>
          {error && <p className="mt-1" style={{ color: "#9E4332" }}>{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr style={{ borderBottom: "1px solid #EFEADF" }}>
      <td className="px-4 py-2.5 text-xs" style={{ color: "#2A2620" }}>{t.nit}</td>
      <td className="px-4 py-2.5 text-xs" style={{ color: "#2A2620" }}>{t.nombre ?? "—"}</td>
      <td className="px-4 py-2.5 text-xs" style={{ color: "#9A9281" }}>
        {new Date(t.created_at).toLocaleDateString("es-CO")}
      </td>
      <td className="px-4 py-2.5 text-xs whitespace-nowrap">
        <button onClick={() => setEditando(true)} className="mr-3" style={{ color: "#9A7223" }}>Editar</button>
        <button onClick={eliminar} style={{ color: "#9E4332" }}>Quitar</button>
      </td>
    </tr>
  );
}

export default function ListaAutorretenedores({ terceros }: { terceros: Tercero[] }) {
  const router = useRouter();
  const [nit, setNit] = useState("");
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nit.trim()) { setError("El NIT es obligatorio."); return; }

    setGuardando(true);
    const res = await fetch("/api/impuestos/autorretenedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nit: nit.trim(), nombre: nombre.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar.");
      setGuardando(false);
      return;
    }

    setNit(""); setNombre("");
    setGuardando(false);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={agregar} className="rounded-xl border p-5 mb-6 grid grid-cols-3 gap-3 items-end" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>NIT *</label>
          <input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="900123456-7"
            className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Nombre o razón social</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Opcional"
            className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
        </div>
        <button type="submit" disabled={guardando}
          className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}>
          {guardando ? "Guardando..." : "Agregar"}
        </button>
        {error && (
          <p className="col-span-3 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
            {error}
          </p>
        )}
      </form>

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
        {terceros.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-lg mb-2" style={{ color: "#1A1814" }}>Sin terceros registrados</p>
            <p className="text-sm" style={{ color: "#9A9281" }}>
              Agrega los NIT que identifiques en los listados de autorretenedores de la DIAN.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                {["NIT", "Nombre", "Agregado", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#9A9281" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terceros.map((t) => (
                <FilaTercero key={t.id} t={t} onCambio={() => router.refresh()} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
