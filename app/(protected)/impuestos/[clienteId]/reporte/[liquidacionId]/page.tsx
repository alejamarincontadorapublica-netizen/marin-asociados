import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ReporteIVA from "@/components/impuestos/ReporteIVA";
import BotonDescargarReporte from "@/components/impuestos/BotonDescargarReporte";

type Params = Promise<{ clienteId: string; liquidacionId: string }>;

export default async function ReporteIVAPage({ params }: { params: Params }) {
  const { clienteId, liquidacionId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: cliente, error: errorCliente } = await supabase
    .from("clientes")
    .select("nombre")
    .eq("id", clienteId)
    .single();

  const { data: liquidacion, error: errorLiquidacion } = await supabase
    .from("resultados")
    .select("*")
    .eq("id", liquidacionId)
    .single();

  if (errorCliente || errorLiquidacion || !cliente || !liquidacion) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <Link href={`/impuestos/${clienteId}`} className="text-xs inline-block" style={{ color: "#9A7223" }}>
          ← Volver a la liquidación
        </Link>
        <BotonDescargarReporte />
      </div>
      <ReporteIVA
        clienteNombre={cliente.nombre}
        periodoInicio={liquidacion.periodo_inicio}
        periodoFin={liquidacion.periodo_fin}
        ivaGenerado={liquidacion.iva_generado}
        ivaDescontable={liquidacion.iva_descontable}
        saldoFinal={liquidacion.saldo}
        detalle={liquidacion.detalle}
        fechaLiquidacion={liquidacion.created_at}
        esFinal={liquidacion.es_final}
      />
    </div>
  );
}
