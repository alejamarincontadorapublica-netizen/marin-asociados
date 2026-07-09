"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CertificadoReteIVA = {
  id: string;
  nit_agente_retenedor: string;
  nombre_agente_retenedor: string | null;
  numero_certificado: string | null;
  monto_retenido: number;
  archivo_nombre: string | null;
  archivo_url_firmada: string | null;
  created_at: string;
};

const fmt = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function CertificadosReteIVA({
  clienteId, periodoInicio, periodoFin, certificados,
}: {
  clienteId: string;
  periodoInicio: string;
  periodoFin: string;
  certificados: CertificadoReteIVA[];
}) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nit, setNit] = useState("");
  const [nombreAgente, setNombreAgente] = useState("");
  const [numeroCert, setNumeroCert] = useState("");
  const [monto, setMonto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function limpiar() {
    setNit(""); setNombreAgente(""); setNumeroCert(""); setMonto(""); setArchivo(null);
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nit.trim() || !monto) {
      setError("El NIT del agente retenedor y el monto retenido son obligatorios.");
      return;
    }

    setGuardando(true);
    const fd = new FormData();
    fd.append("cliente_id", clienteId);
    fd.append("periodo_inicio", periodoInicio);
    fd.append("periodo_fin", periodoFin);
    fd.append("nit_agente_retenedor", nit.trim());
    if (nombreAgente.trim()) fd.append("nombre_agente_retenedor", nombreAgente.trim());
    if (numeroCert.trim()) fd.append("numero_certificado", numeroCert.trim());
    fd.append("monto_retenido", monto);
    if (archivo) fd.append("archivo", archivo);

    const res = await fetch("/api/impuestos/reteiva", { method: "POST", body: fd });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar el certificado.");
      setGuardando(false);
      return;
    }

    setGuardando(false);
    limpiar();
    setMostrarForm(false);
    router.refresh();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este certificado de ReteIVA?")) return;
    await fetch(`/api/impuestos/reteiva/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const total = certificados.reduce((acc, c) => acc + c.monto_retenido, 0);

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
            Certificados de Retención de IVA (ReteIVA)
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
            Se descuentan del saldo a pagar de este periodo. Puedes anexar certificados atrasados de compradores que retienen IVA.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarForm((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
        >
          {mostrarForm ? "Cancelar" : "+ Anexar certificado"}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={agregar} className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-lg" style={{ backgroundColor: "#FDFBF7" }}>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>NIT agente retenedor *</label>
            <input value={nit} onChange={(e) => setNit(e.target.value)} placeholder="900123456-7"
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Nombre del agente retenedor</label>
            <input value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} placeholder="Opcional"
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Número de certificado</label>
            <input value={numeroCert} onChange={(e) => setNumeroCert(e.target.value)} placeholder="Opcional"
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Monto retenido *</label>
            <input value={monto} onChange={(e) => setMonto(e.target.value)} type="number" placeholder="0"
              className="w-full px-3 py-2 rounded-lg text-sm border" style={{ borderColor: "#E8E1D4" }} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1" style={{ color: "#9A9281" }}>Archivo del certificado (PDF o imagen)</label>
            <input type="file" accept=".pdf,image/*" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-sm" />
          </div>
          {error && (
            <p className="col-span-2 text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
              {error}
            </p>
          )}
          <div className="col-span-2">
            <button type="submit" disabled={guardando}
              className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}>
              {guardando ? "Guardando..." : "Guardar certificado"}
            </button>
          </div>
        </form>
      )}

      {certificados.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "#9A9281" }}>
          Sin certificados de ReteIVA registrados en este periodo.
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: "#E8E1D4" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                {["Agente retenedor", "N° certificado", "Monto", "Archivo", ""].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold" style={{ color: "#9A9281" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certificados.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < certificados.length - 1 ? "1px solid #EFEADF" : "none" }}>
                  <td className="px-3 py-2 text-xs" style={{ color: "#2A2620" }}>
                    {c.nombre_agente_retenedor ?? "—"} <span style={{ color: "#9A9281" }}>({c.nit_agente_retenedor})</span>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: "#9A9281" }}>{c.numero_certificado ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-right font-medium" style={{ color: "#3B6D2E" }}>{fmt(c.monto_retenido)}</td>
                  <td className="px-3 py-2 text-xs">
                    {c.archivo_url_firmada ? (
                      <a href={c.archivo_url_firmada} target="_blank" rel="noopener noreferrer" style={{ color: "#9A7223" }}>
                        {c.archivo_nombre ?? "Ver archivo"}
                      </a>
                    ) : (
                      <span style={{ color: "#9A9281" }}>Sin archivo</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <button onClick={() => eliminar(c.id)} style={{ color: "#9E4332" }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                <td colSpan={2} className="px-3 py-2 text-xs font-semibold" style={{ color: "#1A1814" }}>Total ReteIVA del periodo</td>
                <td className="px-3 py-2 text-xs text-right font-semibold" style={{ color: "#3B6D2E" }}>{fmt(total)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
