"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BotonEliminarCliente({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando]   = useState(false);

  async function handleEliminar() {
    setEliminando(true);
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    router.push("/clientes");
    router.refresh();
  }

  if (confirmando) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
        style={{ backgroundColor: "#F6E9E6", borderColor: "#F0D5D0" }}
      >
        <span className="text-xs" style={{ color: "#9E4332" }}>
          ¿Eliminar a {nombre}?
        </span>
        <button
          onClick={handleEliminar}
          disabled={eliminando}
          className="text-xs px-3 py-1 rounded-lg font-semibold disabled:opacity-60"
          style={{ backgroundColor: "#9E4332", color: "#FFFFFF" }}
        >
          {eliminando ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="text-xs px-3 py-1 rounded-lg border"
          style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
      style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
    >
      Eliminar cliente
    </button>
  );
}
