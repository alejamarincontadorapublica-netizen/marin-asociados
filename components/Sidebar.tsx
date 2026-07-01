"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const secciones = [
  {
    titulo: "Principal",
    items: [
      { href: "/panel",        etiqueta: "Panel general",   icono: "▦" },
    ],
  },
  {
    titulo: "Gestión",
    items: [
      { href: "/clientes",     etiqueta: "Clientes",        icono: "◎" },
      { href: "/facturacion",  etiqueta: "Facturación DIAN",icono: "◈" },
      { href: "/impuestos",    etiqueta: "Impuestos",       icono: "◑" },
    ],
  },
  {
    titulo: "Contabilidad",
    items: [
      { href: "/informes",     etiqueta: "Informes",        icono: "◧" },
      { href: "/nomina",       etiqueta: "Nómina",          icono: "◈" },
      { href: "/exogena",      etiqueta: "Exógena",         icono: "◉" },
    ],
  },
  {
    titulo: "Sistema",
    items: [
      { href: "/integraciones",etiqueta: "Agentes C-Suite", icono: "◬" },
      { href: "/respaldos",    etiqueta: "Respaldos",       icono: "◫" },
      { href: "/configuracion",etiqueta: "Configuración",   icono: "◌" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 w-56 flex flex-col overflow-y-auto border-r z-20"
      style={{ backgroundColor: "#211E19", borderColor: "#2A261F" }}
    >
      <nav className="flex-1 py-4 px-3">
        {secciones.map((seccion) => (
          <div key={seccion.titulo} className="mb-5">
            <p
              className="text-xs font-semibold uppercase tracking-widest px-3 mb-2"
              style={{ color: "#6B4F2A" }}
            >
              {seccion.titulo}
            </p>
            {seccion.items.map((item) => {
              const activo = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors relative"
                  style={{
                    backgroundColor: activo ? "#2A261F" : "transparent",
                    color: activo ? "#C0A36B" : "#9A9281",
                    borderLeft: activo ? "2px solid #C0A36B" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!activo) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#2A261F";
                      (e.currentTarget as HTMLElement).style.color = "#FAF8F4";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!activo) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#9A9281";
                    }
                  }}
                >
                  <span className="text-xs opacity-70">{item.icono}</span>
                  {item.etiqueta}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className="px-4 py-3 border-t text-xs"
        style={{ borderColor: "#2A261F", color: "#6B4F2A" }}
      >
        Sistema v0.2 · Capa 2
      </div>
    </aside>
  );
}
