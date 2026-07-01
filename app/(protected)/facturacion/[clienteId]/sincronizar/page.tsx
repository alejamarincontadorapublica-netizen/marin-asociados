import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import FormularioSincronizar from "@/components/facturacion/FormularioSincronizar";

type Params = Promise<{ clienteId: string }>;

export default async function SincronizarPage({ params }: { params: Params }) {
  const { clienteId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (error || !cliente) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link href="/facturacion" className="text-xs mb-3 inline-block" style={{ color: "#9A7223" }}>
          ← Volver a facturación
        </Link>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Sincronizar DIAN
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          {cliente.nombre} · {cliente.tipo === "empresa" ? `NIT ${cliente.nit}` : `C.C. ${cliente.cedula}`}
        </p>
      </div>

      {/* Paso 1 — Instrucciones del agente */}
      <div
        className="rounded-xl border p-5 mb-5"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm"
            style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}
          >
            1
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-semibold mb-2" style={{ color: "#1A1814" }}>
              Ejecuta el agente DIAN en tu computador
            </h3>
            <p className="text-sm mb-3" style={{ color: "#9A9281" }}>
              Abre una terminal en la carpeta del proyecto y ejecuta:
            </p>
            <div
              className="rounded-lg px-4 py-3 font-mono text-sm mb-3"
              style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}
            >
              python agentes/agente_dian.py
            </div>
            <div className="text-sm space-y-1.5" style={{ color: "#9A9281" }}>
              <p>El agente va a:</p>
              <p>→ Abrir Chrome y entrar al portal DIAN con los datos de <strong style={{ color: "#2A2620" }}>{cliente.nombre}</strong></p>
              <p>→ Pedirte el token OTP que le llegará al cliente por correo</p>
              <p>→ Descargar los archivos Excel de emitidos y recibidos</p>
              <p>→ Guardar los archivos en la carpeta <code className="text-xs px-1 rounded" style={{ backgroundColor: "#EFEADF" }}>descargas/</code></p>
            </div>
            {cliente.factura_aiu && (
              <div
                className="mt-3 px-3 py-2 rounded-lg text-xs"
                style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}
              >
                Este cliente factura por AIU ({cliente.porcentaje_aiu}% admin). El IVA descontable se calculará con prorrateo automáticamente.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paso 2 — Subir archivos */}
      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-sm"
            style={{ backgroundColor: "#1A1814", color: "#C0A36B" }}
          >
            2
          </div>
          <div className="flex-1">
            <h3 className="font-serif font-semibold mb-1" style={{ color: "#1A1814" }}>
              Sube los archivos Excel descargados
            </h3>
            <p className="text-sm mb-4" style={{ color: "#9A9281" }}>
              Una vez el agente haya terminado, sube aquí los dos archivos .xls que descargó.
            </p>
            <FormularioSincronizar clienteId={clienteId} clienteNombre={cliente.nombre} />
          </div>
        </div>
      </div>
    </div>
  );
}
