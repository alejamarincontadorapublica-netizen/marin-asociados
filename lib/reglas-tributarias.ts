// Reglas de clasificación DIAN — validadas con datos reales (Método Marín)

export type ClasificacionDoc = "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "IGNORAR";
export type GrupoDoc = "Emitido" | "Recibido";

const TIPOS_IGNORAR = [
  "application response",
  "documento soporte",
  "nomina",
  "nómina",
  "nota de ajuste",
  "documento equivalente",
  "cobro de peajes",
];

const TIPOS_NOTA_CREDITO = [
  "nota de credito electronica",
  "nota de crédito electrónica",
];

const TIPOS_NOTA_DEBITO = [
  "nota de debito electronica",
  "nota de débito electrónica",
];

export function clasificarDocumento(tipoDoc: string): ClasificacionDoc {
  const tipo = tipoDoc.toLowerCase().trim();
  if (TIPOS_IGNORAR.some((t) => tipo.includes(t))) return "IGNORAR";
  if (TIPOS_NOTA_CREDITO.some((t) => tipo.includes(t))) return "NOTA_CREDITO";
  if (TIPOS_NOTA_DEBITO.some((t) => tipo.includes(t))) return "NOTA_DEBITO";
  return "FACTURA";
}

// Un "documento soporte" es una compra a un tercero no obligado a facturar.
// Para IVA se ignora (clasificacion IGNORAR), pero para Retención en la Fuente
// SÍ cuenta como una compra sobre la que se debe practicar retención.
export function esDocumentoSoporte(tipoDoc: string): boolean {
  return tipoDoc.toLowerCase().trim().includes("documento soporte");
}

export function calcularIVA(documentos: Array<{
  clasificacion: ClasificacionDoc;
  grupo: GrupoDoc;
  iva: number;
  factura_aiu?: boolean;
  porcentaje_aiu?: number;
}>) {
  let facturas_venta = 0, notas_credito_venta = 0, notas_debito_venta = 0;
  let facturas_compra = 0, notas_credito_compra = 0, notas_debito_compra = 0;

  for (const doc of documentos) {
    if (doc.clasificacion === "IGNORAR") continue;

    let valor = doc.iva ?? 0;

    // Prorrateo AIU en compras si aplica
    if (doc.grupo === "Recibido" && doc.factura_aiu && doc.porcentaje_aiu) {
      valor = valor * (doc.porcentaje_aiu / 100);
    }

    if (doc.grupo === "Emitido") {
      if (doc.clasificacion === "FACTURA")      facturas_venta      += valor;
      if (doc.clasificacion === "NOTA_CREDITO") notas_credito_venta += valor;
      if (doc.clasificacion === "NOTA_DEBITO")  notas_debito_venta  += valor;
    } else {
      if (doc.clasificacion === "FACTURA")      facturas_compra      += valor;
      if (doc.clasificacion === "NOTA_CREDITO") notas_credito_compra += valor;
      if (doc.clasificacion === "NOTA_DEBITO")  notas_debito_compra  += valor;
    }
  }

  const iva_generado    = facturas_venta  + notas_debito_venta  - notas_credito_venta;
  const iva_descontable = facturas_compra + notas_debito_compra - notas_credito_compra;
  const saldo           = iva_generado - iva_descontable;

  return {
    iva_generado, iva_descontable, saldo,
    detalle: {
      facturas_venta, notas_debito_venta, notas_credito_venta,
      facturas_compra, notas_debito_compra, notas_credito_compra,
    },
  };
}

export function parsearValor(valor: unknown): number {
  if (valor === null || valor === undefined) return 0;
  const str = String(valor).replace(/,/g, "").replace(/\$/g, "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// ── Periodos fiscales de IVA (Capa 3) ──────────────────────────────
// Periodos fijos estándar DIAN. Cada cliente declara bimestral o
// cuatrimestral según su propia periodicidad asignada por la DIAN.

export type Periodicidad = "bimestral" | "cuatrimestral";

export type PeriodoFiscal = { inicio: string; fin: string; etiqueta: string };

const BIMESTRES = [
  { m1: 1,  m2: 2,  etiqueta: "Enero - Febrero" },
  { m1: 3,  m2: 4,  etiqueta: "Marzo - Abril" },
  { m1: 5,  m2: 6,  etiqueta: "Mayo - Junio" },
  { m1: 7,  m2: 8,  etiqueta: "Julio - Agosto" },
  { m1: 9,  m2: 10, etiqueta: "Septiembre - Octubre" },
  { m1: 11, m2: 12, etiqueta: "Noviembre - Diciembre" },
];

const CUATRIMESTRES = [
  { m1: 1, m2: 4,  etiqueta: "Enero - Abril" },
  { m1: 5, m2: 8,  etiqueta: "Mayo - Agosto" },
  { m1: 9, m2: 12, etiqueta: "Septiembre - Diciembre" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const ultimoDiaMes = (anio: number, mes: number) => new Date(anio, mes, 0).getDate();

export function generarPeriodosFiscales(periodicidad: Periodicidad, anio: number): PeriodoFiscal[] {
  const rangos = periodicidad === "bimestral" ? BIMESTRES : CUATRIMESTRES;
  return rangos.map((r) => ({
    inicio: `${anio}-${pad(r.m1)}-01`,
    fin: `${anio}-${pad(r.m2)}-${pad(ultimoDiaMes(anio, r.m2))}`,
    etiqueta: `${r.etiqueta} ${anio}`,
  }));
}

// ── Retención en la Fuente (Capa 3) ────────────────────────────────
// Se declara mensualmente (Formulario 350), para todos los clientes.

const MESES_NOMBRE = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function generarPeriodosMensuales(anio: number): PeriodoFiscal[] {
  return MESES_NOMBRE.map((nombre, i) => {
    const mes = i + 1;
    return {
      inicio: `${anio}-${pad(mes)}-01`,
      fin: `${anio}-${pad(mes)}-${pad(ultimoDiaMes(anio, mes))}`,
      etiqueta: `${nombre} ${anio}`,
    };
  });
}

// Tarifas vigentes desde el 1 de julio de 2026 (Decreto 572 de 2025, UVT 2026 = $52.374).
// Verificar vigencia antes de usar en periodos futuros — estas tarifas han cambiado
// varias veces por vía judicial/administrativa en los últimos meses.
export type ConceptoReteFuente = { id: string; nombre: string; tarifa: number };

export const CONCEPTOS_RETEFUENTE: ConceptoReteFuente[] = [
  { id: "compras_declarante",     nombre: "Compras generales (declarante)",           tarifa: 2.5 },
  { id: "compras_no_declarante",  nombre: "Compras generales (no declarante)",        tarifa: 3.5 },
  { id: "compras_agricolas",      nombre: "Productos agrícolas sin procesar",         tarifa: 1.5 },
  { id: "servicios_declarante",   nombre: "Servicios generales (declarante)",         tarifa: 4 },
  { id: "servicios_no_declarante",nombre: "Servicios generales (no declarante)",      tarifa: 6 },
  { id: "transporte_carga",       nombre: "Transporte de carga",                      tarifa: 1 },
  { id: "transporte_pasajeros",   nombre: "Transporte de pasajeros terrestre",        tarifa: 3.5 },
  { id: "servicios_temporales",   nombre: "Servicios temporales (sobre AIU)",         tarifa: 1 },
  { id: "vigilancia_aseo",        nombre: "Vigilancia y aseo (sobre AIU)",            tarifa: 2 },
  { id: "hoteles_restaurantes",   nombre: "Hoteles y restaurantes",                   tarifa: 3.5 },
  { id: "arrendamiento_muebles",  nombre: "Arrendamiento de bienes muebles",          tarifa: 4 },
  { id: "arrendamiento_inmuebles",nombre: "Arrendamiento de bienes inmuebles",        tarifa: 3.5 },
  { id: "honorarios_juridica",    nombre: "Honorarios / comisiones (persona jurídica)", tarifa: 11 },
  { id: "honorarios_no_declarante", nombre: "Honorarios / comisiones (no declarante)", tarifa: 10 },
  { id: "rendimientos_financieros", nombre: "Rendimientos financieros",               tarifa: 7 },
  { id: "construccion",           nombre: "Contratos de construcción",                tarifa: 2 },
  { id: "otros",                  nombre: "Otros ingresos tributarios",               tarifa: 2.5 },
];
