import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import ListaAutorretenedores from "@/components/impuestos/ListaAutorretenedores";

export default async function AutorretenedoresPage() {
  const supabase = await createServerSupabaseClient();
  const { data: terceros } = await supabase
    .from("terceros_autorretenedores")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <div>
      <Link href="/impuestos" className="text-xs mb-4 inline-block" style={{ color: "#9A7223" }}>
        ← Volver a impuestos
      </Link>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Terceros autorretenedores
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Proveedores (por NIT) que son autorretenedores según los listados de la DIAN. No se les practica
          Retención en la Fuente en ningún cliente del sistema.
        </p>
      </div>
      <ListaAutorretenedores terceros={terceros ?? []} />
    </div>
  );
}
