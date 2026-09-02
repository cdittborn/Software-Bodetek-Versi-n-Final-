import type { SupabaseClient } from "@supabase/supabase-js";
import {
  totalMaterialesDeCompras,
  totalMaterialesVacio,
  type TotalMaterialesEvento,
} from "@/lib/filtracion/dashboardCostosEvento";

function tablaNoExiste(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    msg.includes("compras_materiales") ||
    msg.includes("compra_material_trabajos") ||
    msg.includes("42p01") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

type LinkRow = { compra_id: string };
type CompraRow = {
  id: string;
  proveedor: string | null;
  material: string | null;
  numero_factura: string | null;
  valor_bruto: number | null;
};

/**
 * Total de valor_bruto de compras_materiales ligadas al evento
 * vía compra_material_trabajos → trabajos del evento.
 * Sin compras, o si las tablas aún no existen: $0, sin error.
 */
export async function cargarTotalMaterialesEvento(
  supabase: SupabaseClient,
  trabajoIds: string[],
): Promise<TotalMaterialesEvento> {
  if (trabajoIds.length === 0) return totalMaterialesVacio();

  const { data: links, error: linksError } = await supabase
    .from("compra_material_trabajos")
    .select("compra_id")
    .in("trabajo_id", trabajoIds);

  if (linksError) {
    if (tablaNoExiste(linksError)) return totalMaterialesVacio();
    throw new Error(linksError.message);
  }

  const compraIds = [
    ...new Set((links ?? []).map((r) => (r as LinkRow).compra_id).filter(Boolean)),
  ];
  if (compraIds.length === 0) return totalMaterialesVacio();

  const { data: compras, error: comprasError } = await supabase
    .from("compras_materiales")
    .select("id, proveedor, material, numero_factura, valor_bruto")
    .in("id", compraIds);

  if (comprasError) {
    if (tablaNoExiste(comprasError)) return totalMaterialesVacio();
    throw new Error(comprasError.message);
  }

  return totalMaterialesDeCompras(
    ((compras ?? []) as CompraRow[]).map((row) => ({
      id: row.id,
      valorBruto: row.valor_bruto ?? 0,
      proveedor: row.proveedor ?? "",
      material: row.material ?? "",
      numeroFactura: row.numero_factura ?? "",
    })),
  );
}
