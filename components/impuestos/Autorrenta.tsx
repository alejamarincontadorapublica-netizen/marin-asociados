"use client";

const fmt = (n: number) =>
  "$ " + Math.round(n).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

type Documento = {
  grupo: "Emitido" | "Recibido";
  clasificacion: "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "IGNORAR";
  fecha_emision: string | null;
  base: number | null;
  suma: number | null;
};

export default function Autorrenta({
  documentos, periodoInicio, periodoFin, tarifaAutorrenta,
}: {
  documentos: Documento[];
  periodoInicio: string;
  periodoFin: string;
  tarifaAutorrenta: number | null;
}) {
  const enPeriodo = (d: Documento) =>
    d.grupo === "Emitido" && d.fecha_emision && d.fecha_emision >= periodoInicio && d.fecha_emision <= periodoFin;

  const valorBase = (d: Documento) => d.suma ?? d.base ?? 0;

  const ventas = documentos.filter((d) => enPeriodo(d) && d.clasificacion === "FACTURA")
    .reduce((acc, d) => acc + valorBase(d), 0);
  const notasCredito = documentos.filter((d) => enPeriodo(d) && d.clasificacion === "NOTA_CREDITO")
    .reduce((acc, d) => acc + valorBase(d), 0);

  const baseAutorrenta = Math.max(0, ventas - notasCredito);
  const valorAutorrenta = tarifaAutorrenta ? baseAutorrenta * (tarifaAutorrenta / 100) : 0;

  if (!tarifaAutorrenta) {
    return (
      <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "#F6E9E6", borderColor: "#E8C9C0" }}>
        <p className="text-sm font-medium" style={{ color: "#9E4332" }}>
          Falta la tarifa de autorrenta de este cliente
        </p>
        <p className="text-xs mt-1" style={{ color: "#9E4332" }}>
          Configúrala en la ficha del cliente (junto al código CIIU) para calcular el anticipo a la renta mensual.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}>
      <h3 className="font-serif font-semibold mb-1" style={{ color: "#1A1814" }}>
        Autorrenta (anticipo a la renta del mes)
      </h3>
      <p className="text-xs mb-3" style={{ color: "#9A9281" }}>
        Base de ventas (solo factura electrónica, restando notas crédito) × {tarifaAutorrenta}%
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs mb-1" style={{ color: "#9A9281" }}>Ventas (factura electrónica)</p>
          <p className="font-serif text-lg font-bold" style={{ color: "#3B6D2E" }}>{fmt(ventas)}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "#9A9281" }}>Notas crédito</p>
          <p className="font-serif text-lg font-bold" style={{ color: "#9E4332" }}>{fmt(notasCredito)}</p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "#9A9281" }}>Autorrenta a pagar</p>
          <p className="font-serif text-lg font-bold" style={{ color: "#1A1814" }}>{fmt(valorAutorrenta)}</p>
        </div>
      </div>
    </div>
  );
}
