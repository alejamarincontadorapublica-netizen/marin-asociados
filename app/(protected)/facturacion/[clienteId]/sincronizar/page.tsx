import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import SubirExcelDIAN from "@/components/facturacion/SubirExcelDIAN";

type Params = Promise<{ clienteId: string }>;

export default async function SincronizarPage({ params }: { params: Params }) {
  const { clienteId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nombre, tipo, nit, cedula, factura_aiu, porcentaje_aiu")
    .eq("id", clienteId)
    .single();

  if (error || !cliente) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/clientes/${clienteId}`}
          className="text-xs mb-3 inline-block"
          style={{ color: "#9A7223" }}
        >
          ← Volver al cliente
        </Link>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Subir documentos DIAN
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          {cliente.nombre} ·{" "}
          {cliente.tipo === "empresa"
            ? `NIT ${cliente.nit}`
            : `C.C. ${cliente.cedula}`}
        </p>
      </div>

      <div
        className="rounded-xl border p-6"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        {cliente.factura_aiu && (
          <div
            className="mb-4 px-4 py-2.5 rounded-lg text-xs"
            style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}
          >
            Cliente AIU — el IVA descontable de compras se calculará con
            prorrateo del {cliente.porcentaje_aiu}% automáticamente.
          </div>
        )}
        <SubirExcelDIAN clienteId={clienteId} clienteNombre={cliente.nombre} />
      </div>
    </div>
  );
}
