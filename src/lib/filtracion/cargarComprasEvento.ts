import type { SupabaseClient } from "@supabase/supabase-js";
import { construirUrlPublica } from "@/lib/r2/utils";
import { nombreFichaPopup } from "@/lib/filtracion/dashboardFaltantes";
import type { ProyectoFiltracionEnriquecido } from "@/lib/filtracion/completitud";
import type {
  CompraMaterial,
  ProyectoOpcionMaterial,
} from "@/lib/filtracion/materiales";

type Relacion<T> = T | T[] | null;

function many<T>(value: Relacion<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

type CompraRow = {
  id: string;
  evento_id: string;
  fecha_compra: string;
  proveedor: string;
  numero_factura: string;
  material: string;
  valor_neto: number;
  valor_iva: number;
  valor_bruto: number;
  factura_key: string | null;
  factura_nombre: string | null;
  compra_material_trabajos: Relacion<{ trabajo_id: string }>;
};

export type DatosMaterialesEvento = {
  compras: CompraMaterial[];
  proyectos: ProyectoOpcionMaterial[];
  tablasPendientes: boolean;
};

export function opcionesProyectoMaterial(
  proyectos: ProyectoFiltracionEnriquecido[],
): ProyectoOpcionMaterial[] {
  return proyectos.map((p) => ({
    id: p.id,
    etiqueta: nombreFichaPopup(p),
  }));
}

export function tablaNoExiste(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    msg.includes("compras_materiales") ||
    msg.includes("42p01") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

export async function cargarComprasEvento(
  supabase: SupabaseClient,
  eventoId: string,
  proyectos: ProyectoFiltracionEnriquecido[],
): Promise<DatosMaterialesEvento> {
  const opciones = opcionesProyectoMaterial(proyectos);
  const { data, error } = await supabase
    .from("compras_materiales")
    .select(
      "id, evento_id, fecha_compra, proveedor, numero_factura, material, valor_neto, valor_iva, valor_bruto, factura_key, factura_nombre, created_at, compra_material_trabajos ( trabajo_id )",
    )
    .eq("evento_id", eventoId)
    .order("fecha_compra", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    if (tablaNoExiste(error)) {
      return { compras: [], proyectos: opciones, tablasPendientes: true };
    }
    throw new Error(error.message);
  }

  const compras: CompraMaterial[] = ((data ?? []) as CompraRow[]).map((row) => {
    const key = row.factura_key?.trim() || null;
    return {
      id: row.id,
      eventoId: row.evento_id,
      fechaCompra: row.fecha_compra,
      proveedor: row.proveedor,
      numeroFactura: row.numero_factura,
      material: row.material,
      valorNeto: row.valor_neto,
      valorIva: row.valor_iva,
      valorBruto: row.valor_bruto,
      facturaKey: key,
      facturaNombre: row.factura_nombre,
      facturaUrl: key ? construirUrlPublica(key) : null,
      trabajoIds: many(row.compra_material_trabajos).map((a) => a.trabajo_id),
    };
  });

  return { compras, proyectos: opciones, tablasPendientes: false };
}
