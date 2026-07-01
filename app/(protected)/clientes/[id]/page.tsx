import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import FormularioCliente from "@/components/clientes/FormularioCliente";
import BotonEliminarCliente from "@/components/clientes/BotonEliminarCliente";
import SeccionDocumentosDIAN from "@/components/facturacion/SeccionDocumentosDIAN";

type Params = Promise<{ id: string }>;

export default async function DetalleClientePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cliente) notFound();

  // Conteo de documentos para el resumen rápido
  const { count: totalDocs } = await supabase
    .from("documentos")
    .select("*", { count: "exact", head: true })
    .eq("cliente_id", id);

  const { count: emitidosDocs } = await supabase
    .from("documentos")
    .select("*", { count: "exact", head: true })
    .eq("cliente_id", id)
    .eq("grupo", "Emitido");

  const { count: recibidosDocs } = await supabase
    .from("documentos")
    .select("*", { count: "exact", head: true })
    .eq("cliente_id", id)
    .eq("grupo", "Recibido");

  const planEtiqueta: Record<string, string> = {
    base: "Base",
    metodo_marin: "Método Marín",
    firma_premium: "Firma Premium",
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <Link href="/clientes" className="text-xs mb-3 inline-block" style={{ color: "#9A7223" }}>
          ← Volver a clientes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
              {cliente.nombre}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm" style={{ color: "#9A9281" }}>
                {cliente.tipo === "empresa" ? "Empresa" : "Persona natural"}
              </span>
              <span style={{ color: "#E8E1D4" }}>·</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: cliente.regimen === "simple" ? "#E7F0E4" : "#F5EEDF",
                  color:           cliente.regimen === "simple" ? "#3B6D2E" : "#9A7223",
                }}
              >
                {cliente.regimen === "simple" ? "Régimen simple" : "Régimen ordinario"}
              </span>
              <span style={{ color: "#E8E1D4" }}>·</span>
              <span className="text-xs" style={{ color: "#9A9281" }}>
                {planEtiqueta[cliente.plan] ?? cliente.plan}
              </span>
              {cliente.factura_aiu && (
                <>
                  <span style={{ color: "#E8E1D4" }}>·</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}
                  >
                    AIU {cliente.porcentaje_aiu}%
                  </span>
                </>
              )}
            </div>
          </div>
          <BotonEliminarCliente id={cliente.id} nombre={cliente.nombre} />
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Identificación", valor: cliente.tipo === "empresa" ? (cliente.nit ?? "—") : (cliente.cedula ?? "—") },
          { label: "CIIU",           valor: cliente.ciiu ?? "—" },
          { label: "Registro (C.C.)",valor: cliente.municipio ?? "—" },
          { label: "Representante",  valor: cliente.cedula_rl ?? "—" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border p-4"
            style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
          >
            <p className="text-xs mb-1" style={{ color: "#9A9281" }}>{item.label}</p>
            <p className="font-medium text-sm" style={{ color: "#1A1814" }}>{item.valor}</p>
          </div>
        ))}
      </div>

      {/* Municipios ICA */}
      {cliente.municipios_ica && cliente.municipios_ica.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-6"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "#9A9281" }}>
            Municipios donde declara ICA ({cliente.municipios_ica.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cliente.municipios_ica.map((m: string) => (
              <span
                key={m}
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}


      {/* Documentos DIAN */}
      <SeccionDocumentosDIAN
        clienteId={cliente.id}
        clienteNombre={cliente.nombre}
        totalDocs={totalDocs ?? 0}
        emitidos={emitidosDocs ?? 0}
        recibidos={recibidosDocs ?? 0}
      />

      {/* Formulario de edición */}
      <div
        className="rounded-xl border p-1 mb-2"
        style={{ backgroundColor: "#FDFBF7", borderColor: "#E8E1D4" }}
      >
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
            Editar información
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
            Los cambios se guardan inmediatamente en la base de datos.
          </p>
        </div>
      </div>

      <FormularioCliente
        modo="editar"
        inicial={{
          id:             cliente.id,
          nombre:         cliente.nombre,
          tipo:           cliente.tipo,
          nit:            cliente.nit ?? "",
          cedula:         cliente.cedula ?? "",
          cedula_rl:      cliente.cedula_rl ?? "",
          regimen:        cliente.regimen,
          ciiu:           cliente.ciiu ?? "",
          municipio:      cliente.municipio ?? "",
          municipios_ica: cliente.municipios_ica ?? [],
          plan:           cliente.plan,
          factura_aiu:    cliente.factura_aiu ?? false,
          porcentaje_aiu: cliente.porcentaje_aiu?.toString() ?? "",
        }}
      />
    </div>
  );
}
