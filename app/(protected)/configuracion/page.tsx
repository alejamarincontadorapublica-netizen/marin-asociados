import { createServerSupabaseClient } from "@/lib/supabase-server";
import ConceptosRetefuente from "@/components/configuracion/ConceptosRetefuente";
import UvtVigente from "@/components/configuracion/UvtVigente";

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabaseClient();

  const { data: conceptos } = await supabase
    .from("conceptos_retefuente")
    .select("*")
    .order("concepto", { ascending: true });

  const { data: uvtConfig } = await supabase
    .from("configuracion_valores")
    .select("*")
    .eq("clave", "uvt_vigente")
    .single();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Configuración
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Valores tributarios que cambian con la norma — mantenlos actualizados desde aquí
        </p>
      </div>

      <UvtVigente
        valorInicial={uvtConfig?.valor?.valor ?? 0}
        anioInicial={uvtConfig?.valor?.anio ?? new Date().getFullYear()}
        actualizadoEn={uvtConfig?.updated_at ?? null}
      />

      <ConceptosRetefuente conceptos={conceptos ?? []} />
    </div>
  );
}
