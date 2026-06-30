"use client";

import { useState, useRef } from "react";

// Lista de municipios colombianos más comunes (ampliable)
const MUNICIPIOS_SUGERIDOS = [
  "Bogotá D.C.", "Medellín", "Cali", "Barranquilla", "Cartagena",
  "Cúcuta", "Bucaramanga", "Pereira", "Santa Marta", "Ibagué",
  "Pasto", "Manizales", "Neiva", "Villavicencio", "Armenia",
  "Valledupar", "Montería", "Sincelejo", "Popayán", "Florencia",
  "Tunja", "Riohacha", "Quibdó", "Mocoa", "Leticia", "Mitú",
  "Puerto Inírida", "San José del Guaviare", "Arauca", "Yopal",
  "Barrancabermeja", "Buenaventura", "Bello", "Itagüí", "Envigado",
  "Soledad", "Maicao", "Palmira", "Floridablanca", "Girón",
  "Piedecuesta", "Dosquebradas", "Zipaquirá", "Chía", "Facatativá",
  "Fusagasugá", "Soacha", "Mosquera", "Madrid (Cundinamarca)",
  "Funza", "Rionegro", "Sabaneta", "La Estrella", "Copacabana",
  "Bello", "Girardota", "Barbosa (Antioquia)", "Apartadó", "Turbo",
];

type Props = {
  municipios: string[];
  onChange: (municipios: string[]) => void;
};

export default function SelectorMunicipios({ municipios, onChange }: Props) {
  const [inputVal, setInputVal] = useState("");
  const [mostrando, setMostrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sugerencias = MUNICIPIOS_SUGERIDOS.filter(
    (m) =>
      inputVal.length > 0 &&
      m.toLowerCase().includes(inputVal.toLowerCase()) &&
      !municipios.includes(m)
  ).slice(0, 6);

  function agregar(municipio: string) {
    const limpio = municipio.trim();
    if (!limpio || municipios.includes(limpio)) return;
    onChange([...municipios, limpio]);
    setInputVal("");
    setMostrando(false);
    inputRef.current?.focus();
  }

  function quitar(municipio: string) {
    onChange(municipios.filter((m) => m !== municipio));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      agregar(inputVal);
    }
    if (e.key === "Backspace" && !inputVal && municipios.length > 0) {
      quitar(municipios[municipios.length - 1]);
    }
  }

  return (
    <div className="relative">
      {/* Área de tags + input */}
      <div
        className="min-h-10 w-full px-3 py-2 rounded-lg flex flex-wrap gap-1.5 items-center cursor-text"
        style={{ border: "1px solid #E8E1D4", backgroundColor: "#FFFFFF" }}
        onClick={() => inputRef.current?.focus()}
        onFocus={() => setMostrando(true)}
      >
        {municipios.map((m) => (
          <span
            key={m}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#F5EEDF", color: "#9A7223" }}
          >
            {m}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); quitar(m); }}
              className="ml-0.5 hover:opacity-70 leading-none"
              style={{ color: "#9A7223" }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setMostrando(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setMostrando(true)}
          onBlur={() => setTimeout(() => setMostrando(false), 150)}
          placeholder={municipios.length === 0 ? "Escribe un municipio y presiona Enter..." : "Agregar otro..."}
          className="flex-1 min-w-32 text-sm outline-none bg-transparent"
          style={{ color: "#1A1814" }}
        />
      </div>

      {/* Sugerencias desplegables */}
      {mostrando && sugerencias.length > 0 && (
        <div
          className="absolute z-10 w-full mt-1 rounded-lg border shadow-sm overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
        >
          {sugerencias.map((m) => (
            <button
              key={m}
              type="button"
              onMouseDown={() => agregar(m)}
              className="w-full text-left px-4 py-2 text-sm transition-colors"
              style={{ color: "#1A1814" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FDFBF7")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              {m}
            </button>
          ))}
          {inputVal.trim() && !MUNICIPIOS_SUGERIDOS.some(
            (m) => m.toLowerCase() === inputVal.toLowerCase()
          ) && (
            <button
              type="button"
              onMouseDown={() => agregar(inputVal)}
              className="w-full text-left px-4 py-2 text-sm border-t"
              style={{ color: "#9A7223", borderColor: "#E8E1D4", backgroundColor: "#FDFBF7" }}
            >
              + Agregar &quot;{inputVal}&quot;
            </button>
          )}
        </div>
      )}

      <p className="text-xs mt-1.5" style={{ color: "#9A9281" }}>
        Escribe y presiona Enter para agregar · Puedes agregar todos los municipios que necesites
      </p>
    </div>
  );
}
