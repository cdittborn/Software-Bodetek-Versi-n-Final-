/** Totales de dinero del Dashboard 4a. Horas de 4b no entran aquí. */

export type CompraDashboardItem = {
  key: string;
  proveedor: string;
  material: string;
  numeroFactura: string;
  valorBruto: number;
};

export type TotalMaterialesEvento = {
  total: number;
  n: number;
  items: CompraDashboardItem[];
};

export type CostoTotalEstimadoEvento = {
  total: number;
  cotizaciones: number;
  materiales: number;
};

const VACIO_MATERIALES: TotalMaterialesEvento = {
  total: 0,
  n: 0,
  items: [],
};

export function totalMaterialesVacio(): TotalMaterialesEvento {
  return VACIO_MATERIALES;
}

/**
 * Suma valor bruto de cada compra una sola vez.
 * Si la misma compra aparece ligada a varios trabajos, no se cuenta dos veces.
 */
export function totalMaterialesDeCompras(
  compras: {
    id: string;
    valorBruto: number;
    proveedor?: string;
    material?: string;
    numeroFactura?: string;
  }[],
): TotalMaterialesEvento {
  const vistos = new Set<string>();
  const items: CompraDashboardItem[] = [];
  for (const c of compras) {
    if (vistos.has(c.id)) continue;
    vistos.add(c.id);
    const bruto = Number.isFinite(c.valorBruto) ? Math.round(c.valorBruto) : 0;
    items.push({
      key: c.id,
      proveedor: c.proveedor?.trim() || "Sin proveedor",
      material: c.material?.trim() || "Sin material",
      numeroFactura: c.numeroFactura?.trim() || "",
      valorBruto: bruto,
    });
  }
  return {
    total: items.reduce((acc, i) => acc + i.valorBruto, 0),
    n: items.length,
    items,
  };
}

export function costoTotalEstimadoEvento(
  cotizaciones: number,
  materiales: number,
): CostoTotalEstimadoEvento {
  const c = Number.isFinite(cotizaciones) ? Math.round(cotizaciones) : 0;
  const m = Number.isFinite(materiales) ? Math.round(materiales) : 0;
  return {
    cotizaciones: c,
    materiales: m,
    total: c + m,
  };
}
