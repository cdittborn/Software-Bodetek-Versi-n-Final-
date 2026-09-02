/** IVA, bruto, validación y reparto de compras de materiales (filtración). */

export const IVA_TASA = 0.19;

export type CompraMaterial = {
  id: string;
  eventoId: string;
  fechaCompra: string;
  proveedor: string;
  numeroFactura: string;
  material: string;
  valorNeto: number;
  valorIva: number;
  valorBruto: number;
  facturaKey: string | null;
  facturaNombre: string | null;
  facturaUrl: string | null;
  trabajoIds: string[];
};

export type ProyectoOpcionMaterial = {
  id: string;
  etiqueta: string;
};

export type EstadoIvaForm = {
  neto: number | null;
  iva: number | null;
  ivaManual: boolean;
};

export type InputValidacionCompra = {
  fechaCompra: string;
  proveedor: string;
  numeroFactura: string;
  material: string;
  valorNeto: number | null;
  facturaOk: boolean;
  trabajoIds: string[];
};

export type ParteReparto = {
  trabajoId: string;
  neto: number;
  iva: number;
  bruto: number;
};

export type AgregadoPorProyecto = {
  trabajoId: string;
  etiqueta: string;
  comprasN: number;
  neto: number;
  iva: number;
  bruto: number;
  partes: {
    compra: CompraMaterial;
    neto: number;
    iva: number;
    bruto: number;
  }[];
};

export function ivaDesdeNeto(neto: number): number {
  return Math.round(neto * IVA_TASA);
}

export function brutoDesde(neto: number, iva: number): number {
  return neto + iva;
}

export function parseEnteroClp(value: string): number | null {
  const t = value.trim().replace(/\./g, "").replace(/,/g, ".");
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function estadoIvaVacio(): EstadoIvaForm {
  return { neto: null, iva: null, ivaManual: false };
}

/** Cualquier cambio de neto recalcula el IVA (aunque antes se hubiera editado a mano). */
export function aplicarCambioNeto(
  _estado: EstadoIvaForm,
  neto: number | null,
): EstadoIvaForm {
  if (neto == null) return { neto: null, iva: null, ivaManual: false };
  return { neto, iva: ivaDesdeNeto(neto), ivaManual: false };
}

/** Edición directa de IVA: se respeta hasta el próximo cambio de neto. */
export function aplicarCambioIva(
  estado: EstadoIvaForm,
  iva: number | null,
): EstadoIvaForm {
  return { ...estado, iva, ivaManual: true };
}

export function brutoDe(estado: EstadoIvaForm): number | null {
  if (estado.neto == null || estado.iva == null) return null;
  return brutoDesde(estado.neto, estado.iva);
}

/**
 * Reparte un entero en N partes iguales. El resto de la división se asigna
 * a las primeras partes para que la suma coincida con el total.
 */
export function repartirEntero(total: number, n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const resto = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0));
}

export function partesIgualesPorTrabajo(
  compra: Pick<CompraMaterial, "valorNeto" | "valorIva" | "valorBruto" | "trabajoIds">,
): ParteReparto[] {
  const ids = [...compra.trabajoIds].sort((a, b) => a.localeCompare(b));
  const n = ids.length;
  if (n === 0) return [];
  const netos = repartirEntero(compra.valorNeto, n);
  const ivas = repartirEntero(compra.valorIva, n);
  const brutos = repartirEntero(compra.valorBruto, n);
  return ids.map((trabajoId, i) => ({
    trabajoId,
    neto: netos[i] ?? 0,
    iva: ivas[i] ?? 0,
    bruto: brutos[i] ?? 0,
  }));
}

export function agregarPorProyecto(
  compras: CompraMaterial[],
  proyectos: ProyectoOpcionMaterial[],
): AgregadoPorProyecto[] {
  const byId = new Map<string, AgregadoPorProyecto>();
  for (const p of proyectos) {
    byId.set(p.id, {
      trabajoId: p.id,
      etiqueta: p.etiqueta,
      comprasN: 0,
      neto: 0,
      iva: 0,
      bruto: 0,
      partes: [],
    });
  }

  for (const compra of compras) {
    for (const parte of partesIgualesPorTrabajo(compra)) {
      const fila = byId.get(parte.trabajoId);
      if (!fila) continue;
      fila.comprasN += 1;
      fila.neto += parte.neto;
      fila.iva += parte.iva;
      fila.bruto += parte.bruto;
      fila.partes.push({
        compra,
        neto: parte.neto,
        iva: parte.iva,
        bruto: parte.bruto,
      });
    }
  }

  return proyectos.map((p) => byId.get(p.id)!);
}

export function totalesCompras(compras: CompraMaterial[]): {
  neto: number;
  iva: number;
  bruto: number;
  n: number;
  sinFactura: number;
} {
  let neto = 0;
  let iva = 0;
  let bruto = 0;
  let sinFactura = 0;
  for (const c of compras) {
    neto += c.valorNeto;
    iva += c.valorIva;
    bruto += c.valorBruto;
    if (!c.facturaKey) sinFactura += 1;
  }
  return { neto, iva, bruto, n: compras.length, sinFactura };
}

const LABELS_FALTA: { key: keyof InputValidacionCompra; label: string; ok: (v: InputValidacionCompra) => boolean }[] = [
  { key: "proveedor", label: "proveedor", ok: (v) => v.proveedor.trim().length > 0 },
  {
    key: "numeroFactura",
    label: "N° de factura",
    ok: (v) => v.numeroFactura.trim().length > 0,
  },
  { key: "material", label: "material", ok: (v) => v.material.trim().length > 0 },
  { key: "valorNeto", label: "valor neto", ok: (v) => v.valorNeto != null },
  { key: "facturaOk", label: "factura adjunta", ok: (v) => v.facturaOk },
  {
    key: "trabajoIds",
    label: "proyecto asociado",
    ok: (v) => v.trabajoIds.length > 0,
  },
];

export function faltantesCompra(input: InputValidacionCompra): string[] {
  const out: string[] = [];
  if (!input.fechaCompra.trim()) out.push("fecha de compra");
  for (const campo of LABELS_FALTA) {
    if (!campo.ok(input)) out.push(campo.label);
  }
  return out;
}

export function mensajePieFormulario(faltantes: string[]): {
  ok: boolean;
  texto: string;
} {
  if (faltantes.length === 0) {
    return { ok: true, texto: "Todo listo para guardar" };
  }
  return { ok: false, texto: `Falta: ${faltantes.join(", ")}` };
}
