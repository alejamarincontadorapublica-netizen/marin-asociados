"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SubirExcelDIAN from "./SubirExcelDIAN";

export default function SeccionDocumentosDIAN({
  clienteId,
  clienteNombre,
  totalDocs,
  emitidos,
  recibidos,
  facturaAiu = false,
  porcentajeAiu,
}: {
  clienteId: string;
  clienteNombre: string;
  totalDocs: number;
  emitidos: number;
  recibidos: number;
  facturaAiu?: boolean;
  porcentajeAiu?: number | null;
}) {
  const router = useRouter();
  const [mostrarSubida, setMostrarSubida] = useState(false);
  const [conteos, setConteos] = useState({ total: totalDocs, emitidos, recibidos });

  function handleExito(resultado: { total: number; emitidos: number; recibidos: number }) {
    setConteos((prev) => ({
      total:     prev.total     + resultado.total,
      emitidos:  prev.emitidos  + resultado.emitidos,
      recibidos: prev.recibidos + resultado.recibidos,
    }));
    setMostrarSubida(false);
    router.refresh();
  }

  return (
    <div
      className="rounded-xl border mb-6"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
    >
      {/* Encabezado de la sección */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "#E8E1D4" }}
      >
        <div>
          <h2 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
            Documentos DIAN
          </h2>
          {conteos.total > 0 ? (
            <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
              {conteos.total} documentos ·{" "}
              <span style={{ color: "#3B6D2E" }}>{conteos.emitidos} emitidos</span>
              {" · "}
              <span style={{ color: "#9A7223" }}>{conteos.recibidos} recibidos</span>
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
              Sin documentos cargados todavía
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {conteos.total > 0 && (
            <Link
              href={`/facturacion/${clienteId}`}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
            >
              Ver todos
            </Link>
          )}
          <button
            onClick={() => setMostrarSubida((v) => !v)}
            className="text-xs px-4 py-1.5 rounded-lg font-semibold"
            style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
          >
            {mostrarSubida ? "Cancelar" : "Subir Excel DIAN"}
          </button>
        </div>
      </div>

      {/* Panel de subida — se expande al hacer clic */}
      {mostrarSubida && (
        <div className="px-5 py-4">
          <SubirExcelDIAN
            clienteId={clienteId}
            clienteNombre={clienteNombre}
            facturaAiu={facturaAiu}
            porcentajeAiuDefecto={porcentajeAiu}
            onExito={handleExito}
          />
        </div>
      )}

      {/* Estado vacío con botón directo */}
      {!mostrarSubida && conteos.total === 0 && (
        <div className="px-5 py-6 text-center">
          <p className="text-sm mb-3" style={{ color: "#9A9281" }}>
            Descarga los archivos Excel desde la DIAN y súbelos aquí para
            empezar a depurar la información tributaria.
          </p>
          <button
            onClick={() => setMostrarSubida(true)}
            className="text-sm px-5 py-2 rounded-lg font-semibold"
            style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
          >
            Subir Excel DIAN
          </button>
        </div>
      )}
    </div>
  );
}
