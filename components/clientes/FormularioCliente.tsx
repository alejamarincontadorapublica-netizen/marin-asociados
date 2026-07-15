"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SelectorMunicipios from "./SelectorMunicipios";

type Cliente = {
  id?: string;
  nombre: string;
  tipo: "empresa" | "natural";
  nit: string;
  cedula: string;
  cedula_rl: string;
  regimen: "ordinario" | "simple";
  ciiu: string;
  tarifa_autorrenta: string;
  municipio: string;
  municipios_ica: string[];
  plan: "base" | "metodo_marin" | "firma_premium";
  factura_aiu: boolean;
  porcentaje_aiu: string;
  periodicidad_iva: "" | "bimestral" | "cuatrimestral";
  es_agente_retencion: boolean;
};

const vacío: Cliente = {
  nombre: "", tipo: "empresa", nit: "", cedula: "", cedula_rl: "",
  regimen: "ordinario", ciiu: "", tarifa_autorrenta: "", municipio: "", municipios_ica: [],
  plan: "base", factura_aiu: false, porcentaje_aiu: "", periodicidad_iva: "",
  es_agente_retencion: false,
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: "#9A9281" }}>
    {children}
  </label>
);

const Input = ({ value, onChange, placeholder, type = "text", disabled = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
    style={{
      backgroundColor: disabled ? "#F5F3EE" : "#FFFFFF",
      border: "1px solid #E8E1D4",
      color: "#1A1814",
    }}
    onFocus={(e) => { if (!disabled) e.target.style.borderColor = "#C0A36B"; }}
    onBlur={(e) => { e.target.style.borderColor = "#E8E1D4"; }}
  />
);

const Select = ({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
    style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8E1D4", color: "#1A1814" }}
    onFocus={(e) => { e.target.style.borderColor = "#C0A36B"; }}
    onBlur={(e) => { e.target.style.borderColor = "#E8E1D4"; }}
  >
    {children}
  </select>
);

export default function FormularioCliente({
  inicial, modo,
}: {
  inicial?: Partial<Cliente>;
  modo: "crear" | "editar";
}) {
  const router = useRouter();
  const [form, setForm] = useState<Cliente>({ ...vacío, ...inicial });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const set = (campo: keyof Cliente) => (valor: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);

    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      setGuardando(false);
      return;
    }

    const payload = {
      nombre:         form.nombre.trim(),
      tipo:           form.tipo,
      nit:            form.tipo === "empresa" ? form.nit.trim() : null,
      cedula:         form.tipo === "natural"  ? form.cedula.trim() : null,
      cedula_rl:      form.tipo === "empresa"  ? form.cedula_rl.trim() : null,
      regimen:        form.regimen,
      ciiu:           form.ciiu.trim() || null,
      tarifa_autorrenta: form.tarifa_autorrenta ? parseFloat(form.tarifa_autorrenta) : null,
      municipio:      form.municipio.trim() || null,
      municipios_ica: form.municipios_ica,
      plan:           form.plan,
      factura_aiu:    form.factura_aiu,
      porcentaje_aiu: form.factura_aiu && form.porcentaje_aiu
                        ? parseFloat(form.porcentaje_aiu)
                        : null,
      periodicidad_iva: form.periodicidad_iva || null,
      es_agente_retencion: form.es_agente_retencion,
    };

    const url    = modo === "crear" ? "/api/clientes" : `/api/clientes/${inicial?.id}`;
    const method = modo === "crear" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al guardar. Intenta de nuevo.");
      setGuardando(false);
      return;
    }

    router.push("/clientes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Tipo de cliente */}
      <div
        className="rounded-xl border p-5"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <h3 className="font-serif font-semibold mb-4" style={{ color: "#1A1814" }}>
          Tipo de cliente
        </h3>
        <div className="flex gap-3">
          {(["empresa", "natural"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("tipo")(t)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all border"
              style={{
                backgroundColor: form.tipo === t ? "#1A1814" : "#FFFFFF",
                color:           form.tipo === t ? "#C0A36B" : "#9A9281",
                borderColor:     form.tipo === t ? "#1A1814" : "#E8E1D4",
              }}
            >
              {t === "empresa" ? "Empresa / Sociedad" : "Persona natural"}
            </button>
          ))}
        </div>
      </div>

      {/* Datos básicos */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <h3 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
          Datos de identificación
        </h3>

        <div>
          <Label>Nombre o razón social *</Label>
          <Input value={form.nombre} onChange={set("nombre")} placeholder="Nombre completo o razón social" />
        </div>

        {form.tipo === "empresa" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>NIT</Label>
              <Input value={form.nit} onChange={set("nit")} placeholder="900123456-7" />
            </div>
            <div>
              <Label>Cédula representante legal</Label>
              <Input value={form.cedula_rl} onChange={set("cedula_rl")} placeholder="1234567890" />
            </div>
          </div>
        )}

        {form.tipo === "natural" && (
          <div>
            <Label>Cédula</Label>
            <Input value={form.cedula} onChange={set("cedula")} placeholder="1234567890" />
          </div>
        )}
      </div>

      {/* Información tributaria */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <h3 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
          Información tributaria
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Régimen</Label>
            <Select value={form.regimen} onChange={set("regimen")}>
              <option value="ordinario">Régimen ordinario</option>
              <option value="simple">Régimen simple (SIMPLE)</option>
            </Select>
          </div>
          <div>
            <Label>Código CIIU (actividad económica)</Label>
            <Input value={form.ciiu} onChange={set("ciiu")} placeholder="Ej. 4111" />
          </div>
        </div>

        <div>
          <Label>Tarifa de autorrenta (%)</Label>
          <Input
            value={form.tarifa_autorrenta}
            onChange={set("tarifa_autorrenta")}
            placeholder="Ej. 0.55"
            type="number"
          />
          <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
            Según la actividad económica (CIIU) del cliente. Se aplica sobre la base de ventas (solo factura
            electrónica, restando notas crédito) como anticipo mensual a la renta.
          </p>
        </div>

        <div>
          <Label>Periodicidad de IVA</Label>
          <Select value={form.periodicidad_iva} onChange={(v) => set("periodicidad_iva")(v as "" | "bimestral" | "cuatrimestral")}>
            <option value="">Sin definir</option>
            <option value="bimestral">Bimestral</option>
            <option value="cuatrimestral">Cuatrimestral</option>
          </Select>
          <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
            Necesaria para liquidar IVA por periodo en el módulo de Impuestos
          </p>
        </div>

        <div>
          <Label>¿Es agente de retención?</Label>
          <div className="flex gap-3 mt-1">
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => set("es_agente_retencion")(v)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{
                  backgroundColor: form.es_agente_retencion === v ? "#1A1814" : "#FFFFFF",
                  color:           form.es_agente_retencion === v ? "#C0A36B" : "#9A9281",
                  borderColor:     form.es_agente_retencion === v ? "#1A1814" : "#E8E1D4",
                }}
              >
                {v ? "Sí, retiene" : "No, aún no supera los topes"}
              </button>
            ))}
          </div>
          <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
            Necesario para practicar Retención en la Fuente sobre sus compras en el módulo de Impuestos
          </p>
        </div>

        <div>
          <Label>Municipio de registro (cámara de comercio)</Label>
          <Input
            value={form.municipio}
            onChange={set("municipio")}
            placeholder="Municipio donde está matriculado el establecimiento"
          />
        </div>

        <div>
          <Label>Municipios donde declara ICA</Label>
          <SelectorMunicipios
            municipios={form.municipios_ica}
            onChange={(v) => set("municipios_ica")(v)}
          />
          {form.municipios_ica.length > 0 && (
            <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
              {form.municipios_ica.length} municipio{form.municipios_ica.length > 1 ? "s" : ""} registrado{form.municipios_ica.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Plan y facturación AIU */}
      <div
        className="rounded-xl border p-5 space-y-4"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8E1D4" }}
      >
        <h3 className="font-serif font-semibold" style={{ color: "#1A1814" }}>
          Plan y facturación
        </h3>

        <div>
          <Label>Plan</Label>
          <Select value={form.plan} onChange={set("plan")}>
            <option value="base">Base</option>
            <option value="metodo_marin">Método Marín</option>
            <option value="firma_premium">Firma Premium</option>
          </Select>
        </div>

        <div>
          <Label>¿Factura por AIU?</Label>
          <div className="flex gap-3 mt-1">
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => set("factura_aiu")(v)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{
                  backgroundColor: form.factura_aiu === v ? "#1A1814" : "#FFFFFF",
                  color:           form.factura_aiu === v ? "#C0A36B" : "#9A9281",
                  borderColor:     form.factura_aiu === v ? "#1A1814" : "#E8E1D4",
                }}
              >
                {v ? "Sí, factura por AIU" : "No"}
              </button>
            ))}
          </div>
        </div>

        {form.factura_aiu && (
          <div>
            <Label>Porcentaje de Administración (% AIU descontable para IVA)</Label>
            <Input
              value={form.porcentaje_aiu}
              onChange={set("porcentaje_aiu")}
              placeholder="Ej. 15"
              type="number"
            />
            <p className="text-xs mt-1" style={{ color: "#9A9281" }}>
              Solo el % de Administración. IVA descontable = IVA total × (% admin ÷ 100)
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm rounded-lg px-4 py-2.5" style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/clientes")}
          className="px-5 py-2.5 rounded-lg text-sm border transition-colors"
          style={{ borderColor: "#E8E1D4", color: "#9A9281", backgroundColor: "#FFFFFF" }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
        >
          {guardando
            ? "Guardando..."
            : modo === "crear" ? "Crear cliente" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
