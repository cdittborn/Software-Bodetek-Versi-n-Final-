import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { cargarDatosEventoFiltracion } from "@/lib/filtracion/cargarDatosEventoFiltracion";
import { enriquecerProyectos } from "@/lib/filtracion/completitud";
import { listarFaltantes } from "@/lib/informe-seguro/faltantes";
import { fuenteDesdeProyectos, type FuenteProyecto } from "@/lib/informe-seguro/fuente";
import {
  type InformeGuardado,
  type ResultadoPersistir,
  type VersionLista,
} from "@/lib/informe-seguro/resultado";
import {
  armarSnapshot,
  type BorradorInforme,
  type EncabezadoInforme,
  type SeleccionMedia,
} from "@/lib/informe-seguro/snapshot";

export type { InformeGuardado, ResultadoPersistir, VersionLista };

type FilaInforme = {
  id: string;
  token: string;
  token_activo: boolean;
  token_expira: string | null;
  nombre: string;
  nombre_evento: string;
  fecha_evento: string | null;
  direccion_centro: string;
  numero_siniestro: string | null;
  numero_poliza: string | null;
  contacto_bodetek: string;
  fecha_emision: string | null;
};

function tokenNuevo(): string {
  return randomBytes(32).toString("base64url");
}

function tablaAusente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /informes_seguro|schema cache/i.test(msg)
  );
}

function encabezadoDe(fila: FilaInforme): EncabezadoInforme {
  return {
    nombre: fila.nombre ?? "",
    nombreEvento: fila.nombre_evento ?? "",
    fechaEvento: fila.fecha_evento,
    direccionCentro: fila.direccion_centro ?? "",
    numeroSiniestro: fila.numero_siniestro,
    numeroPoliza: fila.numero_poliza,
    contactoBodetek: fila.contacto_bodetek ?? "",
    fechaEmision: fila.fecha_emision,
  };
}

export async function leerInforme(
  supabase: SupabaseClient,
  eventoId: string,
): Promise<{ pendiente: true } | { pendiente: false; informe: InformeGuardado | null }> {
  const { data, error } = await supabase
    .from("informes_seguro")
    .select(
      "id, token, token_activo, token_expira, nombre, nombre_evento, fecha_evento, direccion_centro, numero_siniestro, numero_poliza, contacto_bodetek, fecha_emision",
    )
    .eq("evento_id", eventoId)
    .maybeSingle();

  if (error) {
    if (tablaAusente(error)) return { pendiente: true };
    throw new Error(error.message);
  }
  if (!data) return { pendiente: false, informe: null };

  const fila = data as FilaInforme;
  const [recintos, subproyectos, media, versionesRaw] = await Promise.all([
    supabase
      .from("informe_seguro_recintos")
      .select("trabajo_id, incluido, descripcion_seguro, descripcion_validada, validada_at, validada_por")
      .eq("informe_id", fila.id),
    supabase
      .from("informe_seguro_subproyectos")
      .select("trabajo_id, tipo_problema, incluido, descripcion_seguro")
      .eq("informe_id", fila.id),
    supabase
      .from("informe_seguro_media")
      .select("trabajo_media_id, incluido, orden, es_portada")
      .eq("informe_id", fila.id),
    supabase
      .from("informe_seguro_versiones")
      .select("numero, publicado_at, publicado_por")
      .eq("informe_id", fila.id)
      .order("numero", { ascending: false }),
  ]);

  for (const res of [recintos, subproyectos, media, versionesRaw]) {
    if (res.error) {
      if (tablaAusente(res.error) || /descripcion_validada|42703/i.test(res.error.message ?? "")) {
        return { pendiente: true };
      }
      throw new Error(res.error.message);
    }
  }

  const autores = [
    ...new Set(
      ((versionesRaw.data ?? []) as { publicado_por: string | null }[])
        .map((v) => v.publicado_por)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const nombres = new Map<string, string>();
  if (autores.length > 0) {
    const { data: perfiles } = await supabase
      .from("perfiles")
      .select("id, nombre")
      .in("id", autores);
    for (const p of (perfiles ?? []) as { id: string; nombre: string | null }[]) {
      if (p.nombre) nombres.set(p.id, p.nombre);
    }
  }

  return {
    pendiente: false,
    informe: {
      id: fila.id,
      token: fila.token,
      tokenActivo: fila.token_activo,
      borrador: {
        encabezado: encabezadoDe(fila),
        tokenExpira: fila.token_expira,
        recintos: ((recintos.data ?? []) as {
          trabajo_id: string;
          incluido: boolean;
          descripcion_seguro: string;
          descripcion_validada?: boolean;
        }[]).map((r) => ({
          trabajoId: r.trabajo_id,
          incluido: r.incluido,
          descripcionSeguro: r.descripcion_seguro ?? "",
          descripcionValidada: r.descripcion_validada === true,
        })),
        subproyectos: ((subproyectos.data ?? []) as {
          trabajo_id: string;
          tipo_problema: BorradorInforme["subproyectos"][number]["tipo"];
          incluido: boolean;
          descripcion_seguro: string;
        }[]).map((s) => ({
          trabajoId: s.trabajo_id,
          tipo: s.tipo_problema,
          incluido: s.incluido,
          descripcionSeguro: s.descripcion_seguro ?? "",
        })),
        media: ((media.data ?? []) as {
          trabajo_media_id: string;
          incluido: boolean;
          orden: number;
          es_portada: boolean;
        }[]).map((m) => ({
          trabajoMediaId: m.trabajo_media_id,
          incluido: m.incluido,
          orden: m.orden,
          esPortada: m.es_portada,
        })),
      },
      versiones: ((versionesRaw.data ?? []) as {
        numero: number;
        publicado_at: string;
        publicado_por: string | null;
      }[]).map((v) => ({
        numero: v.numero,
        publicadoAt: v.publicado_at,
        publicadoPor: v.publicado_por ? (nombres.get(v.publicado_por) ?? null) : null,
      })),
    },
  };
}

function limpiar(
  fuente: FuenteProyecto[],
  borrador: BorradorInforme,
): { borrador: BorradorInforme; mediaTipo: Map<string, "foto" | "video">; mediaProyecto: Map<string, { trabajoId: string; tipo: string | null }> } {
  const trabajos = new Map(fuente.map((p) => [p.trabajoId, p]));
  const mediaProyecto = new Map<string, { trabajoId: string; tipo: string | null }>();
  const mediaTipo = new Map<string, "foto" | "video">();
  for (const proyecto of fuente) {
    for (const media of proyecto.media) {
      mediaProyecto.set(media.id, {
        trabajoId: proyecto.trabajoId,
        tipo: media.problemaTipo,
      });
      mediaTipo.set(media.id, media.tipoArchivo);
    }
  }

  const media: SeleccionMedia[] = borrador.media.filter((m) => mediaProyecto.has(m.trabajoMediaId));
  const grupos = new Map<string, SeleccionMedia[]>();
  for (const item of media) {
    const meta = mediaProyecto.get(item.trabajoMediaId)!;
    const key = `${meta.trabajoId}:${meta.tipo ?? ""}`;
    const lista = grupos.get(key) ?? [];
    lista.push(item);
    grupos.set(key, lista);
  }
  for (const lista of grupos.values()) {
    lista.sort((a, b) => a.orden - b.orden);
    let hayPortada = false;
    for (const item of lista) {
      const esFoto = mediaTipo.get(item.trabajoMediaId) === "foto";
      if (item.esPortada && esFoto && item.incluido && !hayPortada) {
        hayPortada = true;
        item.esPortada = true;
      } else {
        item.esPortada = false;
      }
    }
  }

  return {
    borrador: {
      encabezado: borrador.encabezado,
      tokenExpira: borrador.tokenExpira,
      recintos: borrador.recintos.filter((r) => trabajos.has(r.trabajoId)),
      subproyectos: borrador.subproyectos.filter((s) =>
        trabajos.get(s.trabajoId)?.subproyectos.some((x) => x.tipo === s.tipo),
      ),
      media,
    },
    mediaTipo,
    mediaProyecto,
  };
}

function filaEncabezado(borrador: BorradorInforme, updatedAt: string) {
  const e = borrador.encabezado;
  return {
    nombre: e.nombre.trim(),
    nombre_evento: e.nombreEvento.trim(),
    fecha_evento: e.fechaEvento,
    direccion_centro: e.direccionCentro.trim(),
    numero_siniestro: e.numeroSiniestro?.trim() || null,
    numero_poliza: e.numeroPoliza?.trim() || null,
    contacto_bodetek: e.contactoBodetek.trim(),
    fecha_emision: e.fechaEmision,
    token_expira: borrador.tokenExpira,
    updated_at: updatedAt,
  };
}

export async function guardarInformeEnBase(input: {
  supabase: SupabaseClient;
  userId: string;
  eventoId: string;
  categoriaId: string;
  subtipoId: string;
  borrador: BorradorInforme;
  publicar: boolean;
  confirmarFaltantes: boolean;
  activarLink?: boolean;
}): Promise<ResultadoPersistir> {
  const datos = await cargarDatosEventoFiltracion(input.supabase, {
    categoriaId: input.categoriaId,
    subtipoId: input.subtipoId,
    eventoId: input.eventoId,
  });
  if (!datos) return { ok: false, error: "No se encontró el evento." };

  const fuente = fuenteDesdeProyectos(
    enriquecerProyectos(datos.emergencias),
    datos.proveedores,
  );
  const limpio = limpiar(fuente, input.borrador);
  const faltantes = listarFaltantes(fuente, limpio.borrador);
  if (input.publicar && faltantes.total > 0 && !input.confirmarFaltantes) {
    return { ok: false, requiereConfirmacion: true, faltantes };
  }

  const ahora = new Date().toISOString();
  const existente = await leerInforme(input.supabase, input.eventoId);
  if (existente.pendiente) {
    return {
      ok: false,
      pendiente: true,
      error: "Falta aplicar la migración del informe en la base.",
    };
  }

  let informeId = existente.informe?.id ?? null;
  let token = existente.informe?.token ?? tokenNuevo();

  if (!informeId) {
    const { data, error } = await input.supabase
      .from("informes_seguro")
      .insert({
        evento_id: input.eventoId,
        token,
        token_activo: false,
        created_by: input.userId,
        ...filaEncabezado(limpio.borrador, ahora),
      })
      .select("id, token")
      .single();
    if (error || !data) {
      if (tablaAusente(error)) {
        return { ok: false, pendiente: true, error: "Falta aplicar la migración del informe en la base." };
      }
      return { ok: false, error: error?.message ?? "No se pudo crear el informe." };
    }
    informeId = (data as { id: string; token: string }).id;
    token = (data as { id: string; token: string }).token;
  } else {
    const { error } = await input.supabase
      .from("informes_seguro")
      .update(filaEncabezado(limpio.borrador, ahora))
      .eq("id", informeId);
    if (error) return { ok: false, error: error.message };
  }

  const borrados = await Promise.all([
    input.supabase.from("informe_seguro_media").delete().eq("informe_id", informeId),
    input.supabase.from("informe_seguro_subproyectos").delete().eq("informe_id", informeId),
    input.supabase.from("informe_seguro_recintos").delete().eq("informe_id", informeId),
  ]);
  for (const res of borrados) {
    if (res.error) return { ok: false, error: res.error.message };
  }

  if (limpio.borrador.recintos.length > 0) {
    const { error } = await input.supabase.from("informe_seguro_recintos").insert(
      limpio.borrador.recintos.map((r) => ({
        informe_id: informeId,
        trabajo_id: r.trabajoId,
        incluido: r.incluido,
        descripcion_seguro: r.descripcionSeguro.trim(),
        descripcion_validada: r.descripcionValidada,
        validada_at: r.descripcionValidada ? ahora : null,
        validada_por: r.descripcionValidada ? input.userId : null,
      })),
    );
    if (error) return { ok: false, error: error.message };
  }
  if (limpio.borrador.subproyectos.length > 0) {
    const { error } = await input.supabase.from("informe_seguro_subproyectos").insert(
      limpio.borrador.subproyectos.map((s) => ({
        informe_id: informeId,
        trabajo_id: s.trabajoId,
        tipo_problema: s.tipo,
        incluido: s.incluido,
        descripcion_seguro: s.descripcionSeguro.trim(),
      })),
    );
    if (error) return { ok: false, error: error.message };
  }
  if (limpio.borrador.media.length > 0) {
    const { error } = await input.supabase.from("informe_seguro_media").insert(
      limpio.borrador.media.map((m) => {
        const meta = limpio.mediaProyecto.get(m.trabajoMediaId)!;
        return {
          informe_id: informeId,
          trabajo_media_id: m.trabajoMediaId,
          trabajo_id: meta.trabajoId,
          tipo_problema: meta.tipo,
          incluido: m.incluido,
          orden: m.orden,
          es_portada: m.esPortada,
        };
      }),
    );
    if (error) return { ok: false, error: error.message };
  }

  let tokenActivo = existente.informe?.tokenActivo ?? false;
  if (input.activarLink && !tokenActivo) {
    const activo = await input.supabase
      .from("informes_seguro")
      .update({ token_activo: true, updated_at: new Date().toISOString() })
      .eq("id", informeId);
    if (activo.error) return { ok: false, error: activo.error.message };
    tokenActivo = true;
  }
  if (input.publicar) {
    const snapshot = armarSnapshot(fuente, limpio.borrador);
    const { data: ultima } = await input.supabase
      .from("informe_seguro_versiones")
      .select("numero")
      .eq("informe_id", informeId)
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle();
    const numero = ((ultima as { numero?: number } | null)?.numero ?? 0) + 1;
    const { error } = await input.supabase.from("informe_seguro_versiones").insert({
      informe_id: informeId,
      numero,
      publicado_por: input.userId,
      contenido: snapshot,
    });
    if (error) return { ok: false, error: error.message };
    const activo = await input.supabase
      .from("informes_seguro")
      .update({ token_activo: true, updated_at: new Date().toISOString() })
      .eq("id", informeId);
    if (activo.error) return { ok: false, error: activo.error.message };
    tokenActivo = true;
  }

  return {
    ok: true,
    tokenActivo,
    linkPath: tokenActivo ? `/informe-seguro/${token}` : null,
  };
}

export async function cambiarToken(input: {
  supabase: SupabaseClient;
  eventoId: string;
  modo: "desactivar" | "regenerar";
}): Promise<ResultadoPersistir> {
  const leido = await leerInforme(input.supabase, input.eventoId);
  if (leido.pendiente) {
    return { ok: false, pendiente: true, error: "Falta aplicar la migración del informe en la base." };
  }
  if (!leido.informe) return { ok: false, error: "Todavía no hay un informe guardado." };

  if (input.modo === "desactivar") {
    const { error } = await input.supabase
      .from("informes_seguro")
      .update({ token_activo: false, updated_at: new Date().toISOString() })
      .eq("id", leido.informe.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, tokenActivo: false, linkPath: null };
  }

  const token = tokenNuevo();
  const { error } = await input.supabase
    .from("informes_seguro")
    .update({
      token,
      token_activo: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leido.informe.id);
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    tokenActivo: true,
    linkPath: `/informe-seguro/${token}`,
  };
}
