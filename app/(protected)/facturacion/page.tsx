import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function FacturacionPage() {
  const supabase = await createServerSupabaseClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre, tipo, nit, cedula, regimen")
    .order("nombre");

  // Conteo de documentos por cliente
  const { data: conteos } = await supabase
    .from("documentos")
    .select("cliente_id, grupo");

  const conteoPorCliente = (conteos ?? []).reduce<Record<string, { emitidos: number; recibidos: number }>>(
    (acc, doc) => {
      if (!acc[doc.cliente_id]) acc[doc.cliente_id] = { emitidos: 0, recibidos: 0 };
      if (doc.grupo === "Emitido")  acc[doc.cliente_id].emitidos++;
      if (doc.grupo === "Recibido") acc[doc.cliente_id].recibidos++;
      return acc;
    }, {}
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Facturación DIAN
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Sincroniza los documentos electrónicos de cada cliente desde la DIAN
        </p>
      </div>

      {/* Instrucciones del agente */}
      <div
        className="rounded-xl border p-5 mb-6"
        style={{ backgroundColor: "#F5EEDF", borderColor: "#E8D9B8" }}
      >
        <h2 className="font-serif font-semibold mb-2" style={{ color: "#6B4F2A" }}>
          Cómo funciona la sincronización
        </h2>
        <ol className="text-sm space-y-1.5 list-decimal list-inside" style={{ color: "#9A7223" }}>
          <li>Ejecuta el agente local en tu computador: <code className="px-1 rounded text-xs" style={{ backgroundColor: "#EDE0C4" }}>python agentes/agente_dian.py</code></li>
          <li>El agente abre Chrome, entra al portal DIAN y descarga los Excel de emitidos y recibidos</li>
          <li>Regresa aquí, selecciona el cliente y sube los dos archivos Excel</li>
          <li>El sistema los procesa con las reglas del Método Marín y guarda en la base de datos</li>
        </ol>
      </div>

      {/* Lista de clientes */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        {!clientes || clientes.length === 0 ? (
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
                {["Cliente", "Identificación", "Documentos DIAN", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wide" style={{ color: "#9A9281" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((c, i) => {
                const cnt = conteoPorCliente[c.id] ?? { emitidos: 0, recibidos: 0 };
                const total = cnt.emitidos + cnt.recibidos;
                return (
                  <tr key={c.id} style={{ borderBottom: i < clientes.length - 1 ? "1px solid #EFEADF" : "none" }}>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: "#1A1814" }}>{c.nombre}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
                        {c.regimen === "simple" ? "Régimen simple" : "Régimen ordinario"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#2A2620" }}>
                      {c.tipo === "empresa" ? (c.nit ?? "—") : (c.cedula ?? "—")}
                    </td>
                    <td className="px-4 py-3">
                      {total === 0 ? (
                        <span className="text-xs" style={{ color: "#9A9281" }}>Sin documentos</span>
                      ) : (
                        <div className="flex gap-3">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#E7F0E4", color: "#3B6D2E" }}>
                            {cnt.emitidos} emitidos
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}>
                            {cnt.recibidos} recibidos
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/facturacion/${c.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
                        >
                          Ver documentos
                        </Link>
                        <Link
                          href={`/facturacion/${c.id}/sincronizar`}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
                        >
                          Sincronizar
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
