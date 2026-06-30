import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BuscadorClientes from "@/components/clientes/BuscadorClientes";

type SearchParams = Promise<{ q?: string; pagina?: string }>;

export default async function ClientesPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", pagina = "1" } = await searchParams;
  const porPagina = 20;
  const paginaNum = Math.max(1, parseInt(pagina));
  const desde = (paginaNum - 1) * porPagina;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("clientes")
    .select("*", { count: "exact" })
    .order("nombre", { ascending: true })
    .range(desde, desde + porPagina - 1);

  if (q) {
    query = query.or(`nombre.ilike.%${q}%,nit.ilike.%${q}%,cedula.ilike.%${q}%`);
  }

  const { data: clientes, count } = await query;
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  const planEtiqueta: Record<string, string> = {
    base: "Base",
    metodo_marin: "Método Marín",
    firma_premium: "Firma Premium",
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
            Clientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#9A9281" }}>
            {total} cliente{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="px-4 py-2.5 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
        >
          + Nuevo cliente
        </Link>
      </div>

      {/* Buscador */}
      <BuscadorClientes valorInicial={q} />

      {/* Tabla */}
      <div
        className="rounded-xl border overflow-hidden mt-4"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        {!clientes || clientes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-lg mb-2" style={{ color: "#1A1814" }}>
              {q ? "Sin resultados" : "Aún no hay clientes"}
            </p>
            <p className="text-sm" style={{ color: "#9A9281" }}>
              {q
                ? `No se encontró ningún cliente con "${q}"`
                : 'Crea el primer cliente haciendo clic en "+ Nuevo cliente"'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E1D4", backgroundColor: "#FDFBF7" }}>
                {["Nombre / Razón social", "Identificación", "Régimen", "Plan", "Municipio", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold tracking-wide"
                    style={{ color: "#9A9281" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < clientes.length - 1 ? "1px solid #EFEADF" : "none",
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: "#1A1814" }}>{c.nombre}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
                      {c.tipo === "empresa" ? "Empresa" : "Persona natural"}
                      {c.factura_aiu && (
                        <span
                          className="ml-2 px-1.5 py-0.5 rounded text-xs"
                          style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}
                        >
                          AIU {c.porcentaje_aiu}%
                        </span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#2A2620" }}>
                    {c.tipo === "empresa" ? (c.nit ?? "—") : (c.cedula ?? "—")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: c.regimen === "simple" ? "#E7F0E4" : "#F5EEDF",
                        color:           c.regimen === "simple" ? "#3B6D2E" : "#9A7223",
                      }}
                    >
                      {c.regimen === "simple" ? "Simple" : "Ordinario"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#9A9281" }}>
                    {planEtiqueta[c.plan] ?? c.plan}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#9A9281" }}>
                    {c.municipio ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                      style={{ borderColor: "#E8E1D4", color: "#9A7223" }}
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "#9A9281" }}>
            Página {paginaNum} de {totalPaginas} · {total} clientes en total
          </p>
          <div className="flex gap-2">
            {paginaNum > 1 && (
              <Link
                href={`/clientes?q=${q}&pagina=${paginaNum - 1}`}
                className="px-3 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
              >
                ← Anterior
              </Link>
            )}
            {paginaNum < totalPaginas && (
              <Link
                href={`/clientes?q=${q}&pagina=${paginaNum + 1}`}
                className="px-3 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
