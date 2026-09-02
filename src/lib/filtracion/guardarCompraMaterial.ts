import { createClient } from "@/lib/supabase/client";

type PresignResponse = {
  url?: string;
  key?: string;
  error?: string;
};

async function solicitarPresign(body: {
  nombreArchivo: string;
  tipoArchivo: string;
  carpeta: string;
}): Promise<{ url: string; key: string }> {
  const res = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as PresignResponse;
  if (!res.ok || !data.url || !data.key) {
    throw new Error(data.error ?? "No se pudo firmar la subida");
  }
  return { url: data.url, key: data.key };
}

export async function subirFacturaCompra(opts: {
  compraId: string;
  file: File;
}): Promise<{ key: string; nombre: string }> {
  const carpeta = `compras/${opts.compraId}`;
  const nombre = opts.file.name || "factura";
  const { url, key } = await solicitarPresign({
    nombreArchivo: nombre,
    tipoArchivo: opts.file.type || "application/octet-stream",
    carpeta,
  });
  const put = await fetch(url, {
    method: "PUT",
    body: opts.file,
    headers: { "Content-Type": opts.file.type || "application/octet-stream" },
  });
  if (!put.ok) {
    throw new Error(
      `R2 rechazó el archivo (${put.status}). Revisa CORS del bucket.`,
    );
  }
  return { key, nombre };
}

export async function guardarCompraMaterial(opts: {
  id: string;
  eventoId: string;
  fechaCompra: string;
  proveedor: string;
  numeroFactura: string;
  material: string;
  valorNeto: number;
  valorIva: number;
  valorBruto: number;
  facturaKey: string;
  facturaNombre: string;
  trabajoIds: string[];
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("compras_materiales").insert({
    id: opts.id,
    evento_id: opts.eventoId,
    fecha_compra: opts.fechaCompra,
    proveedor: opts.proveedor.trim(),
    numero_factura: opts.numeroFactura.trim(),
    material: opts.material.trim(),
    valor_neto: opts.valorNeto,
    valor_iva: opts.valorIva,
    valor_bruto: opts.valorBruto,
    factura_key: opts.facturaKey,
    factura_nombre: opts.facturaNombre,
  });
  if (error) throw new Error(error.message);

  const filas = opts.trabajoIds.map((trabajo_id) => ({
    compra_id: opts.id,
    trabajo_id,
  }));
  const { error: errAsoc } = await supabase
    .from("compra_material_trabajos")
    .insert(filas);
  if (errAsoc) throw new Error(errAsoc.message);
}
