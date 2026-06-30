import Link from "next/link";
import FormularioCliente from "@/components/clientes/FormularioCliente";

export default function NuevoClientePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clientes"
          className="text-xs mb-3 inline-block"
          style={{ color: "#9A7223" }}
        >
          ← Volver a clientes
        </Link>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A1814" }}>
          Nuevo cliente
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A9281" }}>
          Completa los datos del cliente. Podrás editarlos en cualquier momento.
        </p>
      </div>
      <FormularioCliente modo="crear" />
    </div>
  );
}
