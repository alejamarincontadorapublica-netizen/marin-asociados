"use client";

export default function BotonDescargarReporte() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print text-xs px-4 py-2 rounded-lg font-semibold"
      style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
    >
      Descargar / Imprimir PDF
    </button>
  );
}
