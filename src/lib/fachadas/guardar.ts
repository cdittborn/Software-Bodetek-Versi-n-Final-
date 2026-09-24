import { createClient } from "@/lib/supabase/client";
import { estadoFachadaHaciaDb, type EstadoFachada } from "@/lib/fachadas/estado";
import {
  copiarSnapshotAlCrear,
  actualizarSnapshotDesdeFachada,
  type EjecutadoPorFachada,
  type EstadoMedidasForm,
  type TipoIntervencionFachada,
} from "@/lib/fachadas/indicadores";
import { ivaDesdeNeto, brutoDesde } from "@/lib/filtracion/materiales";

export async function crearFachada(input: {
  nombre: string;
  recintoId: string | null;
  medidas: EstadoMedidasForm;
  notas: string | null;
}): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const sug = input.medidas;
  if (
    sug.altoM == null ||
    sug.anchoM == null ||
    sug.superficieM2 == null ||
    sug.altoM <= 0 ||
    sug.anchoM <= 0 ||
    sug.superficieM2 <= 0
  ) {
    throw new Error("Alto, ancho y superficie deben ser mayores a 0");
  }
  const { data, error } = await supabase
    .from("fachadas")
    .insert({
      nombre: input.nombre.trim(),
      recinto_id: input.recintoId,
      alto_m: sug.altoM,
      ancho_m: sug.anchoM,
      superficie_m2: sug.superficieM2,
      notas: input.notas?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(mensajeErrorFachada(error));
  return data.id;
}

export async function guardarFachada(input: {
  id: string;
  nombre: string;
  recintoId: string | null;
  medidas: EstadoMedidasForm;
  notas: string | null;
}): Promise<void> {
  const supabase = createClient();
  const sug = input.medidas;
  if (
    sug.altoM == null ||
    sug.anchoM == null ||
    sug.superficieM2 == null ||
    sug.altoM <= 0 ||
    sug.anchoM <= 0 ||
    sug.superficieM2 <= 0
  ) {
    throw new Error("Alto, ancho y superficie deben ser mayores a 0");
  }
  const { error } = await supabase
    .from("fachadas")
    .update({
      nombre: input.nombre.trim(),
      recinto_id: input.recintoId,
      alto_m: sug.altoM,
      ancho_m: sug.anchoM,
      superficie_m2: sug.superficieM2,
      notas: input.notas?.trim() || null,
    })
    .eq("id", input.id);
  if (error) throw new Error(mensajeErrorFachada(error));
}

export async function guardarArchivoFachada(
  fachadaId: string,
  campo: "foto" | "plano",
  key: string | null,
  nombre: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fachadas")
    .update(
      campo === "foto"
        ? { foto_key: key, foto_nombre: nombre }
        : { plano_key: key, plano_nombre: nombre },
    )
    .eq("id", fachadaId);
  if (error) throw new Error(error.message);
}

export async function crearIntervencion(fachadaId: string): Promise<string> {
  const supabase = createClient();
  const { data: fachada, error: fErr } = await supabase
    .from("fachadas")
    .select("alto_m, ancho_m, superficie_m2")
    .eq("id", fachadaId)
    .maybeSingle();
  if (fErr || !fachada) throw new Error(fErr?.message ?? "Fachada no encontrada");
  const snap = copiarSnapshotAlCrear({
    altoM: Number(fachada.alto_m),
    anchoM: Number(fachada.ancho_m),
    superficieM2: Number(fachada.superficie_m2),
    superficieManual: true,
  });
  if (
    snap.altoMSnapshot == null ||
    snap.anchoMSnapshot == null ||
    snap.superficieM2Snapshot == null
  ) {
    throw new Error("La fachada no tiene medidas válidas");
  }
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_intervenciones")
    .insert({
      fachada_id: fachadaId,
      alto_m_snapshot: snap.altoMSnapshot,
      ancho_m_snapshot: snap.anchoMSnapshot,
      superficie_m2_snapshot: snap.superficieM2Snapshot,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la intervención");
  }
  return data.id;
}

function mensajeErrorFachada(error: { code?: string; message?: string } | null): string {
  if (!error) return "No se pudo guardar la fachada";
  if (error.code === "23505") {
    return "Ya existe una fachada con ese nombre en este recinto (o como general)";
  }
  return error.message || "No se pudo guardar la fachada";
}

export async function actualizarSnapshotIntervencion(
  intervencionId: string,
  fachadaId: string,
): Promise<{
  altoMSnapshot: number;
  anchoMSnapshot: number;
  superficieM2Snapshot: number;
}> {
  const supabase = createClient();
  const { data: fachada, error: fErr } = await supabase
    .from("fachadas")
    .select("alto_m, ancho_m, superficie_m2")
    .eq("id", fachadaId)
    .maybeSingle();
  if (fErr || !fachada) throw new Error(fErr?.message ?? "Fachada no encontrada");
  const snap = actualizarSnapshotDesdeFachada({
    altoM: Number(fachada.alto_m),
    anchoM: Number(fachada.ancho_m),
    superficieM2: Number(fachada.superficie_m2),
    superficieManual: true,
  });
  const { error } = await supabase
    .from("fachada_intervenciones")
    .update({
      alto_m_snapshot: snap.altoMSnapshot,
      ancho_m_snapshot: snap.anchoMSnapshot,
      superficie_m2_snapshot: snap.superficieM2Snapshot,
    })
    .eq("id", intervencionId);
  if (error) throw new Error(error.message);
  if (
    snap.altoMSnapshot == null ||
    snap.anchoMSnapshot == null ||
    snap.superficieM2Snapshot == null
  ) {
    throw new Error("La fachada no tiene medidas válidas");
  }
  return {
    altoMSnapshot: snap.altoMSnapshot,
    anchoMSnapshot: snap.anchoMSnapshot,
    superficieM2Snapshot: snap.superficieM2Snapshot,
  };
}

export type GuardarIntervencionInput = {
  id: string;
  estado: EstadoFachada;
  fechaInicio: string | null;
  fechaTermino: string | null;
  notas: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  proveedorId: string | null;
  requiereHojalateria: boolean;
  sinMateriales: boolean;
  tipos: { tipo: TipoIntervencionFachada; dias: number }[];
  cotizaciones: {
    id: string;
    proveedorId: string | null;
    numeroCotizacion: string | null;
    valorNeto: number;
    valorIva: number;
    tipos: TipoIntervencionFachada[];
  }[];
  hojalaterias: {
    id: string;
    proveedorId: string | null;
    descripcion: string | null;
    valorNeto: number;
    valorIva: number;
  }[];
  materiales: {
    id: string;
    fechaCompra: string | null;
    proveedorId: string | null;
    numeroFactura: string | null;
    material: string;
    valorNeto: number;
    valorIva: number;
  }[];
};

export async function guardarIntervencion(
  input: GuardarIntervencionInput,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fachada_intervenciones")
    .update({
      estado: estadoFachadaHaciaDb(input.estado),
      fecha_inicio: input.fechaInicio || null,
      fecha_termino: input.fechaTermino || null,
      notas: input.notas?.trim() || null,
      ejecutado_por: input.ejecutadoPor,
      proveedor_id: input.proveedorId,
      requiere_hojalateria: input.requiereHojalateria,
      sin_materiales: input.sinMateriales,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);

  const { error: delTipos } = await supabase
    .from("fachada_intervencion_tipos")
    .delete()
    .eq("intervencion_id", input.id);
  if (delTipos) throw new Error(delTipos.message);
  if (input.tipos.length > 0) {
    const { error: insTipos } = await supabase
      .from("fachada_intervencion_tipos")
      .insert(
        input.tipos.map((t) => ({
          intervencion_id: input.id,
          tipo: t.tipo,
          dias: t.dias,
        })),
      );
    if (insTipos) throw new Error(insTipos.message);
  }

  for (const c of input.cotizaciones) {
    const { error: u } = await supabase
      .from("fachada_cotizaciones")
      .update({
        proveedor_id: c.proveedorId,
        numero_cotizacion: c.numeroCotizacion?.trim() || null,
        valor_neto: c.valorNeto,
        valor_iva: c.valorIva,
        valor_bruto: brutoDesde(c.valorNeto, c.valorIva),
      })
      .eq("id", c.id);
    if (u) throw new Error(u.message);
    const { error: d } = await supabase
      .from("fachada_cotizacion_tipos")
      .delete()
      .eq("cotizacion_id", c.id);
    if (d) throw new Error(d.message);
    if (c.tipos.length > 0) {
      const { error: it } = await supabase.from("fachada_cotizacion_tipos").insert(
        c.tipos.map((tipo) => ({ cotizacion_id: c.id, tipo })),
      );
      if (it) throw new Error(it.message);
    }
  }

  for (const h of input.hojalaterias) {
    const { error: u } = await supabase
      .from("fachada_hojalateria")
      .update({
        proveedor_id: h.proveedorId,
        descripcion: h.descripcion?.trim() || null,
        valor_neto: h.valorNeto,
        valor_iva: h.valorIva,
        valor_bruto: brutoDesde(h.valorNeto, h.valorIva),
      })
      .eq("id", h.id);
    if (u) throw new Error(u.message);
  }

  for (const m of input.materiales) {
    const { error: u } = await supabase
      .from("fachada_materiales")
      .update({
        fecha_compra: m.fechaCompra || null,
        proveedor_id: m.proveedorId,
        numero_factura: m.numeroFactura?.trim() || null,
        material: m.material.trim(),
        valor_neto: m.valorNeto,
        valor_iva: m.valorIva,
        valor_bruto: brutoDesde(m.valorNeto, m.valorIva),
      })
      .eq("id", m.id);
    if (u) throw new Error(u.message);
  }
}

export async function insertarCotizacionVacia(intervencionId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fachada_cotizaciones")
    .insert({
      intervencion_id: intervencionId,
      valor_neto: 0,
      valor_iva: ivaDesdeNeto(0),
      valor_bruto: 0,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo agregar la cotización");
  return data.id;
}

export async function insertarHojalateriaVacia(intervencionId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fachada_hojalateria")
    .insert({
      intervencion_id: intervencionId,
      valor_neto: 0,
      valor_iva: 0,
      valor_bruto: 0,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo agregar hojalatería");
  return data.id;
}

export async function insertarMaterialVacio(intervencionId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fachada_materiales")
    .insert({
      intervencion_id: intervencionId,
      material: "",
      valor_neto: 0,
      valor_iva: 0,
      valor_bruto: 0,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo agregar el material");
  return data.id;
}

export async function borrarCotizacion(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_cotizaciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function borrarHojalateria(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_hojalateria").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function borrarMaterial(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_materiales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function borrarFachada(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachadas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function guardarKeyDocumento(
  tabla:
    | "fachada_cotizaciones"
    | "fachada_hojalateria"
    | "fachada_materiales",
  id: string,
  campo: "cotizacion" | "factura",
  key: string | null,
  nombre: string | null,
): Promise<void> {
  const supabase = createClient();
  const payload =
    campo === "cotizacion"
      ? { cotizacion_key: key, cotizacion_nombre: nombre }
      : { factura_key: key, factura_nombre: nombre };
  const { error } = await supabase.from(tabla).update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}
