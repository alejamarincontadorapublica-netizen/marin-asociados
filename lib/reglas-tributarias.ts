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
