import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const periodicidadEtiqueta: Record<string, string> = {
  bimestral: "Bimestral",
  cuatrimestral: "Cuatrimestral",
};

export default async function ImpuestosPage() {
  const supabase = await createServerSupabaseClient();

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Impuestos
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Liquidación de IVA por periodo fiscal, con arrastre de saldo entre periodos
        </p>
      </div>

      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        {error ? (
          <div className="py-16 text-center px-6">
            <p className="font-serif text-lg mb-2" style={{ color: "#9E4332" }}>Error al cargar clientes</p>
            <p className="text-sm" style={{ color: "#9E4332" }}>{error.message}</p>
          </div>
        ) : !clientes || clientes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-lg mb-2" style={{ color: "#1A1814" }}>No hay clientes</p>
            <p className="text-sm" style={{ color: "#9A9281" }}>
              Crea primero los clientes en el módulo de Clientes
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                {["Cliente", "Identificación", "Periodicidad IVA", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#9A9281" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < clientes.length - 1 ? "1px solid #EFEADF" : "none" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "#1A1814" }}>{c.nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#2A2620" }}>
                    {c.tipo === "empresa" ? (c.nit ?? "—") : (c.cedula ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    {c.periodicidad_iva ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}>
                        {periodicidadEtiqueta[c.periodicidad_iva] ?? c.periodicidad_iva}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "#9A9281" }}>Sin definir</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/impuestos/${c.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
                    >
                      Liquidar IVA
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
