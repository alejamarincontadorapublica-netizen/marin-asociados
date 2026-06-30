import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function PanelPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tarjetas = [
    { titulo: "Clientes",         valor: "—", sub: "Módulo en construcción",  estado: "pend" },
    { titulo: "Facturación DIAN", valor: "—", sub: "Módulo en construcción",  estado: "pend" },
    { titulo: "Impuestos",        valor: "—", sub: "Módulo en construcción",  estado: "pend" },
    { titulo: "Obligaciones",     valor: "—", sub: "Módulo en construcción",  estado: "pend" },
  ];

  const estadoColors: Record<string, { bg: string; tx: string; label: string }> = {
    ok:   { bg: "#E7F0E4", tx: "#3B6D2E", label: "Al día" },
    pend: { bg: "#F5EEDF", tx: "#9A7223", label: "Pendiente" },
    urg:  { bg: "#F6E9E6", tx: "#9E4332", label: "Urgente" },
  };

  return (
    <div>
      {/* Encabezado del panel */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Panel general
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Bienvenida, {user?.email} · Sistema contable Marín & Asociados
        </p>
      </div>

      {/* Tarjetas de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tarjetas.map((t) => {
          const c = estadoColors[t.estado];
          return (
            <div
              key={t.titulo}
              className="rounded-xl p-5 border"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: "#2A2620" }}>
                  {t.titulo}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: c.bg, color: c.tx }}
                >
                  {c.label}
                </span>
              </div>
              <p className="font-serif text-3xl font-bold" style={{ color: "#1A1814" }}>
                {t.valor}
              </p>
              <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
                {t.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Estado del sistema */}
      <div
        className="rounded-xl border p-6"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <h2 className="font-serif text-lg font-semibold mb-4" style={{ color: "#1A1814" }}>
          Estado del sistema
        </h2>
        <div className="space-y-3">
          {[
            { label: "Base de datos Supabase",  ok: true },
            { label: "Autenticación",           ok: true },
            { label: "Layout y diseño",         ok: true },
            { label: "Módulo Clientes",         ok: false },
            { label: "Facturación DIAN",        ok: false },
            { label: "Impuestos",               ok: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.ok ? "#3B6D2E" : "#E8E1D4" }}
              />
              <span className="text-sm" style={{ color: item.ok ? "#2A2620" : "#9A9281" }}>
                {item.label}
              </span>
              <span
                className="text-xs ml-auto"
                style={{ color: item.ok ? "#3B6D2E" : "#9A9281" }}
              >
                {item.ok ? "✓ Activo" : "Próximo"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
