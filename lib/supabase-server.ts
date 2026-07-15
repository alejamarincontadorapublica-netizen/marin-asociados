import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase/PostgREST corta cada consulta en 1.000 filas por defecto.
// Clientes con muchos documentos (facturación, IVA, ReteFuente) necesitan
// traer TODAS las filas, no solo la primera página — de lo contrario los
// cálculos tributarios quedan incompletos sin ningún error visible.
export async function fetchTodo<T>(
  supabase: SupabaseClient,
  construirConsulta: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null }>
): Promise<T[]> {
  const tamanoPagina = 1000;
  let todo: T[] = [];
  let desde = 0;

  while (true) {
    const { data } = await construirConsulta(desde, desde + tamanoPagina - 1);
    if (!data || data.length === 0) break;
    todo = todo.concat(data);
    if (data.length < tamanoPagina) break;
    desde += tamanoPagina;
  }

  return todo;
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const cookieMethods: CookieMethodsServer = {
    getAll() { return cookieStore.getAll(); },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {}
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  );
}
