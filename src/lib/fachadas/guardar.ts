import { createClient } from "@/lib/supabase/client";
import { estadoFachadaHaciaDb, type EstadoFachada } from "@/lib/fachadas/estado";
import {
  copiarSnapshotAlCrear,
  actualizarSnapshotDesdeFachada,
  estadoDocumentoDefault,
  hayNombreFachadaDuplicado,
  MENSAJE_NOMBRE_FACHADA_DUPLICADO,
  type CategoriaDocumentoFachada,
  type EjecutadoPorFachada,
  type EstadoMedidasForm,
  type TipoDocumentoFachada,
  type TipoIntervencionFachada,
  type TipoMaterialFachada,
} from "@/lib/fachadas/indicadores";
import { ivaDesdeNeto, brutoDesde } from "@/lib/filtracion/materiales";

function exigirMedidas(sug: EstadoMedidasForm): {
  altoM: number;
  anchoM: number;
  superficieM2: number;
} {
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
  return {
    altoM: sug.altoM,
    anchoM: sug.anchoM,
    superficieM2: sug.superficieM2,
  };
}

export type GuardarFachadaCampos = {
  nombre: string;
  medidas: EstadoMedidasForm;
  frecuenciaLimpiezaMeses: number;
  frecuenciaReparacionMeses: number;
  frecuenciaPinturaMeses: number;
  notas: string | null;
};

function exigirFrecuencia(n: number, label: string): number {
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`La frecuencia de ${label} debe ser mayor a 0`);
  }
  return Math.round(n);
}

async function exigirNombreUnico(
  nombre: string,
  excludeId?: string,
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("fachadas").select("id, nombre");
  if (error) throw new Error(error.message);
  if (hayNombreFachadaDuplicado(nombre, data ?? [], excludeId)) {
    throw new Error(MENSAJE_NOMBRE_FACHADA_DUPLICADO);
  }
}

export async function crearFachada(input: GuardarFachadaCampos): Promise<string> {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre de la fachada es obligatorio");
  await exigirNombreUnico(nombre);
  const sug = exigirMedidas(input.medidas);
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachadas")
    .insert({
      nombre,
      letra: null,
      recinto_id: null,
      alto_m: sug.altoM,
      ancho_m: sug.anchoM,
      superficie_m2: sug.superficieM2,
      frecuencia_limpieza_meses: exigirFrecuencia(input.frecuenciaLimpiezaMeses, "limpieza"),
      frecuencia_reparacion_meses: exigirFrecuencia(
        input.frecuenciaReparacionMeses,
        "reparación",
      ),
      frecuencia_pintura_meses: exigirFrecuencia(input.frecuenciaPinturaMeses, "pintura"),
      notas: input.notas?.trim() || null,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(mensajeErrorFachada(error));
  return data.id;
}

export async function guardarFachada(
  input: GuardarFachadaCampos & { id: string },
): Promise<void> {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("El nombre de la fachada es obligatorio");
  await exigirNombreUnico(nombre, input.id);
  const sug = exigirMedidas(input.medidas);
  const supabase = createClient();
  const { error } = await supabase
    .from("fachadas")
    .update({
      nombre,
      alto_m: sug.altoM,
      ancho_m: sug.anchoM,
      superficie_m2: sug.superficieM2,
      frecuencia_limpieza_meses: exigirFrecuencia(input.frecuenciaLimpiezaMeses, "limpieza"),
      frecuencia_reparacion_meses: exigirFrecuencia(
        input.frecuenciaReparacionMeses,
        "reparación",
      ),
      frecuencia_pintura_meses: exigirFrecuencia(input.frecuenciaPinturaMeses, "pintura"),
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
      estado: "programada",
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
    return MENSAJE_NOMBRE_FACHADA_DUPLICADO;
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

export type GuardarDocumentoInput = {
  id: string;
  proveedorId: string | null;
  numero: string | null;
  fecha: string | null;
  valorNeto: number;
  estado: string;
  tipoDocumento?: TipoDocumentoFachada;
};

export type GuardarIntervencionInput = {
  id: string;
  estado: EstadoFachada;
  fechaInicio: string | null;
  fechaTermino: string | null;
  notas: string | null;
  ejecutadoPor: EjecutadoPorFachada | null;
  proveedorId: string | null;
  maestrosAsignados: string | null;
  requiereHojalateria: boolean;
  sinMateriales: boolean;
  tipos: { tipo: TipoIntervencionFachada; dias: number }[];
  documentos: GuardarDocumentoInput[];
  hojalateria: {
    id: string | null;
    proveedorId: string | null;
    descripcion: string | null;
  } | null;
  materiales: {
    id: string;
    tipo: TipoMaterialFachada;
    material: string;
    valorNeto: number;
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
      proveedor_id:
        input.ejecutadoPor === "proveedor_externo" ? input.proveedorId : null,
      maestros_asignados:
        input.ejecutadoPor === "maestros_bodetek"
          ? input.maestrosAsignados?.trim() || null
          : null,
      requiere_hojalateria: input.requiereHojalateria,
      sin_materiales: input.sinMateriales || input.materiales.length === 0,
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

  for (const d of input.documentos) {
    const { error: u } = await supabase
      .from("fachada_documentos")
      .update({
        proveedor_id: d.proveedorId,
        numero: d.numero?.trim() || null,
        fecha: d.fecha || null,
        valor_neto: Math.max(0, Math.round(d.valorNeto)),
        estado: d.estado,
        ...(d.tipoDocumento ? { tipo_documento: d.tipoDocumento } : {}),
      })
      .eq("id", d.id);
    if (u) throw new Error(u.message);
  }

  if (input.requiereHojalateria) {
    const meta = input.hojalateria;
    if (meta?.id) {
      const { error: u } = await supabase
        .from("fachada_hojalateria")
        .update({
          proveedor_id: meta.proveedorId,
          descripcion: meta.descripcion?.trim() || null,
          valor_neto: 0,
          valor_iva: 0,
          valor_bruto: 0,
        })
        .eq("id", meta.id);
      if (u) throw new Error(u.message);
    }
  }

  for (const m of input.materiales) {
    const neto = Math.max(0, Math.round(m.valorNeto));
    const iva = ivaDesdeNeto(neto);
    const { error: u } = await supabase
      .from("fachada_materiales")
      .update({
        tipo: m.tipo,
        material: m.material.trim(),
        valor_neto: neto,
        valor_iva: iva,
        valor_bruto: brutoDesde(neto, iva),
      })
      .eq("id", m.id);
    if (u) throw new Error(u.message);
  }
}

export async function insertarDocumento(input: {
  intervencionId: string;
  tipoDocumento: TipoDocumentoFachada;
  categoria: CategoriaDocumentoFachada;
}): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_documentos")
    .insert({
      intervencion_id: input.intervencionId,
      tipo_documento: input.tipoDocumento,
      categoria: input.categoria,
      valor_neto: 0,
      estado: estadoDocumentoDefault(input.tipoDocumento),
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo agregar el documento");
  }
  return data.id;
}

export async function borrarDocumento(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("fachada_documentos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function guardarArchivoDocumento(
  id: string,
  key: string | null,
  nombre: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("fachada_documentos")
    .update({ archivo_key: key, archivo_nombre: nombre })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertarHojalateriaVacia(intervencionId: string): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("fachada_hojalateria")
    .insert({
      intervencion_id: intervencionId,
      valor_neto: 0,
      valor_iva: 0,
      valor_bruto: 0,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "No se pudo agregar hojalatería");
  return data.id;
}

export async function insertarMaterialVacio(
  intervencionId: string,
  tipo: TipoMaterialFachada = "otros",
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fachada_materiales")
    .insert({
      intervencion_id: intervencionId,
      tipo,
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

export async function marcarPortadaMedia(input: {
  id: string;
  intervencionId: string;
  tipo: "antes" | "despues";
}): Promise<void> {
  const supabase = createClient();
  const { error: clearErr } = await supabase
    .from("fachada_media")
    .update({ es_portada: false })
    .eq("intervencion_id", input.intervencionId)
    .eq("tipo", input.tipo)
    .eq("es_portada", true);
  if (clearErr) throw new Error(clearErr.message);
  const { error } = await supabase
    .from("fachada_media")
    .update({ es_portada: true })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
}
