import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import LiquidacionIVA from "@/components/impuestos/LiquidacionIVA";

type Params = Promise<{ clienteId: string }>;

export default async function ImpuestosClientePage({ params }: { params: Params }) {
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
    .select("fecha_emision, iva, grupo, clasificacion, aiu_porcentaje")
    .eq("cliente_id", clienteId);

  const { data: liquidaciones } = await supabase
    .from("resultados")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("tipo", "IVA")
    .order("periodo_inicio", { ascending: false });

  const { data: certificadosRaw } = await supabase
    .from("certificados_reteiva")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  const certificados = await Promise.all(
    (certificadosRaw ?? []).map(async (c) => {
      let archivo_url_firmada: string | null = null;
      if (c.archivo_ruta) {
        const { data: signed } = await supabase.storage
          .from("reteiva-certificados")
          .createSignedUrl(c.archivo_ruta, 3600);
        archivo_url_firmada = signed?.signedUrl ?? null;
      }
      return { ...c, archivo_url_firmada };
    })
  );

  return (
    <div>
      <div className="mb-6">
        <Link href="/impuestos" className="text-xs mb-3 inline-block" style={{ color: "#9A7223" }}>
          ← Volver a impuestos
        </Link>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          {cliente.nombre}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Liquidación de IVA por periodo fiscal
        </p>
      </div>

      {/* Pestañas de impuestos */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "#E8E1D4" }}>
        <span
          className="px-4 py-2 text-sm font-medium"
          style={{ color: "#1A1814", borderBottom: "2px solid #C0A36B" }}
        >
          IVA
        </span>
        <Link
          href={`/impuestos/${clienteId}/retefuente`}
          className="px-4 py-2 text-sm font-medium"
          style={{ color: "#9A9281" }}
        >
          Retención en la Fuente
        </Link>
      </div>

      {!cliente.periodicidad_iva ? (
        <div
          className="rounded-xl border p-6 text-center"
          style={{ backgroundColor: "#F6E9E6", borderColor: "#E8C9C0" }}
        >
          <p className="font-serif text-lg mb-2" style={{ color: "#9E4332" }}>
            Falta definir la periodicidad de IVA
          </p>
          <p className="text-sm mb-4" style={{ color: "#9E4332" }}>
            Este cliente no tiene configurado si declara bimestral o cuatrimestral.
          </p>
          <Link
            href={`/clientes/${clienteId}`}
            className="text-xs px-4 py-2 rounded-lg font-semibold inline-block"
            style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}
          >
            Configurar en ficha del cliente
          </Link>
        </div>
      ) : (
        <LiquidacionIVA
          clienteId={clienteId}
          periodicidad={cliente.periodicidad_iva}
          facturaAiu={cliente.factura_aiu ?? false}
          porcentajeAiuDefecto={cliente.porcentaje_aiu ?? 0}
          documentos={documentos ?? []}
          liquidaciones={liquidaciones ?? []}
          certificados={certificados}
        />
      )}
    </div>
  );
}
