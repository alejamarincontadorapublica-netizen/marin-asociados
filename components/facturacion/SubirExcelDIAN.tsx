"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Estado = "idle" | "procesando" | "ok" | "error";

export default function SubirExcelDIAN({
  clienteId,
  clienteNombre,
  facturaAiu = false,
  porcentajeAiuDefecto,
  onExito,
}: {
  clienteId: string;
  clienteNombre: string;
  facturaAiu?: boolean;
  porcentajeAiuDefecto?: number | null;
  onExito?: (resultado: { total: number; emitidos: number; recibidos: number }) => void;
}) {
  const router = useRouter();
  const [emitidos,     setEmitidos]     = useState<File | null>(null);
  const [recibidos,    setRecibidos]    = useState<File | null>(null);
  const [aiuPct,       setAiuPct]       = useState<string>(
    porcentajeAiuDefecto != null ? String(porcentajeAiuDefecto) : ""
  );
  const [estado,       setEstado]       = useState<Estado>("idle");
  const [resultado,    setResultado]    = useState<{ total: number; emitidos: number; recibidos: number } | null>(null);
  const [error,        setError]        = useState("");
  const refE = useRef<HTMLInputElement>(null);
  const refR = useRef<HTMLInputElement>(null);

  async function handleSubir(e: React.FormEvent) {
    e.preventDefault();
    if (!emitidos && !recibidos) {
      setError("Sube al menos uno de los dos archivos.");
      return;
    }
    setEstado("procesando");
    setError("");

    const fd = new FormData();
    fd.append("cliente_id", clienteId);
    if (emitidos)  fd.append("emitidos",  emitidos);
    if (recibidos) fd.append("recibidos", recibidos);
    if (facturaAiu && aiuPct) fd.append("aiu_porcentaje", aiuPct);

    const res  = await fetch("/api/facturacion/procesar", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setEstado("error");
      setError(data.error ?? "Error al procesar los archivos.");
      return;
    }

    setEstado("ok");
    setResultado(data);
    if (onExito) onExito(data);
  }

  function resetear() {
    setEstado("idle");
    setEmitidos(null);
    setRecibidos(null);
    setResultado(null);
    setError("");
    setAiuPct(porcentajeAiuDefecto != null ? String(porcentajeAiuDefecto) : "");
  }

  if (estado === "ok" && resultado) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: "#E7F0E4", borderColor: "#C5DDB9" }}
        >
          <p className="font-serif font-semibold mb-1" style={{ color: "#3B6D2E" }}>
            Importación exitosa
          </p>
          <p className="text-sm" style={{ color: "#3B6D2E" }}>
            {resultado.total} documentos guardados para <strong>{clienteNombre}</strong>
          </p>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: "#3B6D2E" }}>
            <span>{resultado.emitidos} emitidos</span>
            <span>{resultado.recibidos} recibidos</span>
            {facturaAiu && aiuPct && <span>AIU {aiuPct}% aplicado</span>}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetear}
            className="px-4 py-2 rounded-lg text-sm border"
            style={{ borderColor: "#E8E1D4", color: "#9A9281" }}
          >
            Subir otro periodo
          </button>
          <button
            onClick={() => { router.push(`/facturacion/${clienteId}`); router.refresh(); }}
            className="px-5 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
          >
            Ver documentos →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubir} className="space-y-4">
      <p className="text-sm" style={{ color: "#9A9281" }}>
        Descarga los archivos desde la DIAN y súbelos aquí. Puedes subir
        emitidos, recibidos o ambos al mismo tiempo.
      </p>

      {/* Campo AIU — solo para clientes con AIU */}
      {facturaAiu && (
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "#F5EEDF", borderColor: "#E8D9B8" }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "#6B4F2A" }}>
            Porcentaje AIU para este lote de documentos
          </p>
          <p className="text-xs mb-3" style={{ color: "#9A7223" }}>
            Cada contrato puede tener un AIU diferente. El valor por defecto del
            cliente es <strong>{porcentajeAiuDefecto ?? "—"}%</strong>. Cámbialo
            si este lote corresponde a un contrato con un % distinto.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={aiuPct}
              onChange={(e) => setAiuPct(e.target.value)}
              placeholder={porcentajeAiuDefecto != null ? String(porcentajeAiuDefecto) : "0"}
              className="w-28 px-3 py-2 rounded-lg border text-sm text-right"
              style={{ borderColor: "#E8D9B8", backgroundColor: "#FFFFFF", color: "#1A1814" }}
            />
            <span className="text-sm font-semibold" style={{ color: "#6B4F2A" }}>%</span>
            {aiuPct !== String(porcentajeAiuDefecto ?? "") && porcentajeAiuDefecto != null && (
              <button
                type="button"
                onClick={() => setAiuPct(String(porcentajeAiuDefecto))}
                className="text-xs underline ml-2"
                style={{ color: "#9A9281" }}
              >
                Restaurar defecto
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ZonaArchivo
          label="Emitidos"
          file={emitidos}
          setFile={setEmitidos}
          inputRef={refE}
        />
        <ZonaArchivo
          label="Recibidos"
          file={recibidos}
          setFile={setRecibidos}
          inputRef={refR}
        />
      </div>

      {error && (
        <p
          className="text-sm rounded-lg px-4 py-2.5"
          style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "procesando" || (!emitidos && !recibidos)}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
        style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
      >
        {estado === "procesando" ? "Procesando..." : "Importar documentos"}
      </button>
    </form>
  );
}

function ZonaArchivo({
  label, file, setFile, inputRef,
}: {
  label: string;
  file: File | null;
  setFile: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer"
      style={{
        borderColor:     file ? "#C0A36B" : "#E8E1D4",
        backgroundColor: file ? "#FDFBF7" : "#FFFFFF",
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) setFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9A9281" }}>
        {label}
      </p>
      {file ? (
        <div>
          <p className="text-sm font-medium" style={{ color: "#C0A36B" }}>{file.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>{(file.size / 1024).toFixed(0)} KB</p>
          <button
            type="button"
            onClick={(ev) => { ev.stopPropagation(); setFile(null); }}
            className="text-xs mt-2 underline"
            style={{ color: "#9E4332" }}
          >
            Quitar
          </button>
        </div>
      ) : (
        <div>
          <p className="text-2xl mb-1" style={{ color: "#E8E1D4" }}>↑</p>
          <p className="text-xs" style={{ color: "#9A9281" }}>
            Haz clic o arrastra el .xls de {label.toLowerCase()}
          </p>
        </div>
      )}
    </div>
  );
}
