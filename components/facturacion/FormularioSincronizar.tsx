"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Estado = "idle" | "procesando" | "ok" | "error";

export default function FormularioSincronizar({
  clienteId, clienteNombre,
}: {
  clienteId: string;
  clienteNombre: string;
}) {
  const router = useRouter();
  const [emitidos,  setEmitidos]  = useState<File | null>(null);
  const [recibidos, setRecibidos] = useState<File | null>(null);
  const [estado,    setEstado]    = useState<Estado>("idle");
  const [resultado, setResultado] = useState<{ total: number; emitidos: number; recibidos: number } | null>(null);
  const [error,     setError]     = useState("");
  const refEmit = useRef<HTMLInputElement>(null);
  const refRecib = useRef<HTMLInputElement>(null);

  async function handleProcesar(e: React.FormEvent) {
    e.preventDefault();
    if (!emitidos && !recibidos) {
      setError("Sube al menos uno de los dos archivos.");
      return;
    }
    setEstado("procesando");
    setError("");

    const formData = new FormData();
    formData.append("cliente_id", clienteId);
    if (emitidos)  formData.append("emitidos",  emitidos);
    if (recibidos) formData.append("recibidos", recibidos);

    const res = await fetch("/api/facturacion/procesar", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setEstado("error");
      setError(data.error ?? "Error al procesar los archivos.");
      return;
    }

    setEstado("ok");
    setResultado(data);
  }

  function FileZone({ label, file, setFile, inputRef, grupo }: {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    grupo: string;
  }) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors"
        style={{ borderColor: file ? "#C0A36B" : "#E8E1D4", backgroundColor: file ? "#FDFBF7" : "#FFFFFF" }}
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
          accept=".xls,.xlsx,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-sm font-medium mb-1" style={{ color: "#1A1814" }}>{label}</p>
        {file ? (
          <div>
            <p className="text-xs font-medium" style={{ color: "#C0A36B" }}>{file.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "#9A9281" }}>
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={(ev) => { ev.stopPropagation(); setFile(null); }}
              className="text-xs mt-2 underline"
              style={{ color: "#9E4332" }}
            >
              Quitar archivo
            </button>
          </div>
        ) : (
          <p className="text-xs" style={{ color: "#9A9281" }}>
            Haz clic o arrastra el .xls de {grupo}
          </p>
        )}
      </div>
    );
  }

  if (estado === "ok" && resultado) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: "#E7F0E4", borderColor: "#C5DDB9" }}
        >
          <p className="font-serif font-semibold mb-1" style={{ color: "#3B6D2E" }}>
            Sincronización exitosa
          </p>
          <p className="text-sm" style={{ color: "#3B6D2E" }}>
            {resultado.total} documentos importados para {clienteNombre}
          </p>
          <div className="flex gap-4 mt-2">
            <span className="text-xs" style={{ color: "#3B6D2E" }}>
              {resultado.emitidos} emitidos
            </span>
            <span className="text-xs" style={{ color: "#3B6D2E" }}>
              {resultado.recibidos} recibidos
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setEstado("idle"); setEmitidos(null); setRecibidos(null); setResultado(null); }}
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
    <form onSubmit={handleProcesar} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FileZone
          label="Emitidos"
          file={emitidos}
          setFile={setEmitidos}
          inputRef={refEmit}
          grupo="emitidos"
        />
        <FileZone
          label="Recibidos"
          file={recibidos}
          setFile={setRecibidos}
          inputRef={refRecib}
          grupo="recibidos"
        />
      </div>

      {error && (
        <p className="text-sm rounded-lg px-4 py-2.5" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "procesando" || (!emitidos && !recibidos)}
        className="px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
        style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
      >
        {estado === "procesando" ? "Procesando..." : "Procesar e importar documentos"}
      </button>
    </form>
  );
}
