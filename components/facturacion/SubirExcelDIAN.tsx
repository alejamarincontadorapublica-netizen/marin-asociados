"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Estado = "idle" | "procesando" | "ok" | "error";

export default function SubirExcelDIAN({
  clienteId,
  clienteNombre,
  onExito,
}: {
  clienteId: string;
  clienteNombre: string;
  onExito?: (resultado: { total: number; emitidos: number; recibidos: number }) => void;
}) {
  const router = useRouter();
  const [emitidos,  setEmitidos]  = useState<File | null>(null);
  const [recibidos, setRecibidos] = useState<File | null>(null);
  const [estado,    setEstado]    = useState<Estado>("idle");
  const [resultado, setResultado] = useState<{ total: number; emitidos: number; recibidos: number } | null>(null);
  const [error,     setError]     = useState("");
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
            {resultado.total} documentos guardados para{" "}
            <strong>{clienteNombre}</strong>
          </p>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: "#3B6D2E" }}>
            <span>{resultado.emitidos} emitidos</span>
            <span>{resultado.recibidos} recibidos</span>
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
      <p className="text-sm mb-2" style={{ color: "#9A9281" }}>
        Descarga los archivos desde la DIAN y súbelos aquí. Puedes subir
        emitidos, recibidos o ambos al mismo tiempo.
      </p>

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
        borderColor:      file ? "#C0A36B" : "#E8E1D4",
        backgroundColor:  file ? "#FDFBF7" : "#FFFFFF",
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
          <p className="text-sm font-medium" style={{ color: "#C0A36B" }}>
            {file.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
            {(file.size / 1024).toFixed(0)} KB
          </p>
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
