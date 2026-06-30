"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 h-16 border-b"
      style={{
        backgroundColor: "#1A1814",
        borderColor: "#2A261F",
      }}
    >
      {/* Identidad izquierda */}
      <div className="flex items-center gap-4">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full border"
          style={{ borderColor: "#C0A36B", backgroundColor: "#211E19" }}
        >
          <span className="font-serif font-bold text-sm" style={{ color: "#C0A36B" }}>
            MA
          </span>
        </div>
        <div>
          <p className="font-serif font-bold text-sm tracking-widest leading-none" style={{ color: "#C0A36B" }}>
            MARÍN & ASOCIADOS
          </p>
          <p className="text-xs leading-none mt-0.5" style={{ color: "#9A7223" }}>
            soluciones contables que generan valor
          </p>
        </div>
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: "#9A9281" }}>
          Alejandra Marín · T.P. 327147
        </span>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            border: "1px solid #2A261F",
            color: "#9A9281",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.borderColor = "#C0A36B";
            (e.target as HTMLElement).style.color = "#C0A36B";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.borderColor = "#2A261F";
            (e.target as HTMLElement).style.color = "#9A9281";
          }}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
