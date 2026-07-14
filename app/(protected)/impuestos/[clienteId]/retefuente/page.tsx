import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import RetencionFuente from "@/components/impuestos/RetencionFuente";

type Params = Promise<{ clienteId: string }>;

export default async function RetefuentePage({ params }: { params: Params }) {
  const { clienteId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (error || !cliente) notFound();

  const { data: documentos } = await supabase
    .from("documentos")
    .select("id, tipo_documento, grupo, fecha_emision, nit_emisor, nombre_emisor, base, numero_documento")
    .eq("cliente_id", clienteId)
    .in("grupo", ["Recibido", "Emitido"]);

  const { data: terceros } = await supabase
    .from("terceros_autorretenedores")
    .select("nit");

  const { data: retenciones } = await supabase
    .from("retenciones_fuente")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("periodo_inicio", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <Link href={`/impuestos/${clienteId}`} className="text-xs mb-3 inline-block" style={{ color: "#9A7223" }}>
          ← Volver a Impuestos
        </Link>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          {cliente.nombre}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Retención en la Fuente
        </p>
      </div>

      {/* Pestañas de impuestos */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "#E8E1D4" }}>
        <Link
          href={`/impuestos/${clienteId}`}
          className="px-4 py-2 text-sm font-medium"
          style={{ color: "#9A9281" }}
        >
          IVA
        </Link>
        <span
          className="px-4 py-2 text-sm font-medium"
          style={{ color: "#1A1814", borderBottom: "2px solid #C0A36B" }}
        >
          Retención en la Fuente
        </span>
      </div>

      {!cliente.es_agente_retencion ? (
        <div className="rounded-xl border p-6 text-center" style={{ backgroundColor: "#F6E9E6", borderColor: "#E8C9C0" }}>
          <p className="font-serif text-lg mb-2" style={{ color: "#9E4332" }}>
            Este cliente no es agente de retención
          </p>
          <p className="text-sm mb-4" style={{ color: "#9E4332" }}>
            No practica Retención en la Fuente sobre sus compras porque aún no supera los topes de ley.
          </p>
          <Link
            href={`/clientes/${clienteId}`}
            className="text-xs px-4 py-2 rounded-lg font-semibold inline-block"
            style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}
          >
            Cambiar en ficha del cliente
          </Link>
        </div>
      ) : (
        <RetencionFuente
          clienteId={clienteId}
          documentos={documentos ?? []}
          nitsAutorretenedores={(terceros ?? []).map((t) => t.nit)}
          retenciones={retenciones ?? []}
        />
      )}
    </div>
  );
}
