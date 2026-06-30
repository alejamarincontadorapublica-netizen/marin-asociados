"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

export default function BuscadorClientes({ valorInicial = "" }: { valorInicial?: string }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const [valor, setValor] = useState(valorInicial);
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValor(v);
    startTransition(() => {
      const params = new URLSearchParams();
      if (v) params.set("q", v);
      params.set("pagina", "1");
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
        style={{ color: "#9A9281" }}
      >
        ◎
      </span>
      <input
        type="text"
        value={valor}
        onChange={handleChange}
        placeholder="Buscar por nombre, NIT o cédula..."
        className="w-full pl-8 pr-4 py-2.5 rounded-lg text-sm outline-none"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8E1D4",
          color: "#1A1814",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#C0A36B")}
        onBlur={(e)  => (e.target.style.borderColor = "#E8E1D4")}
      />
    </div>
  );
}
