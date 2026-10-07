import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { cargarDatosEventoFiltracion } from "@/lib/filtracion/cargarDatosEventoFiltracion";
import { enriquecerProyectos } from "@/lib/filtracion/completitud";
import { fuenteDesdeProyectos, type FuenteProyecto } from "@/lib/informe-seguro/fuente";
import {
  type InformeGuardado,
  type ResultadoPersistir,
  type VersionLista,
} from "@/lib/informe-seguro/resultado";
import {
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

function mensajeGuardado(error: { code?: string; message?: string } | null): string {
  if (!error) return "No se pudo guardar el informe.";
  if (tablaAusente(error) || error.code === "PGRST202" || /guardar_borrador_informe_seguro/i.test(error.message ?? "")) {
    return "Falta aplicar la función de guardado del informe. No escribí nada en la base.";
  }
  return error.message ?? "No se pudo guardar el informe.";
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
  const sinTexto = limpio.borrador.recintos.find(
    (r) =>
      r.descripcionValidada &&
      !limpio.borrador.subproyectos.some(
        (s) => s.trabajoId === r.trabajoId && s.descripcionSeguro.trim().length > 0,
      ),
  );
  if (sinTexto) {
    return {
      ok: false,
      error: "Para validar un recinto, pasa al menos un texto al informe.",
    };
  }

  const { data, error } = await input.supabase.rpc("guardar_borrador_informe_seguro", {
    p_evento_id: input.eventoId,
    p_token: tokenNuevo(),
    p_recintos: limpio.borrador.recintos.map((r) => ({
      trabajo_id: r.trabajoId,
      incluido: r.incluido,
      descripcion_seguro: r.descripcionSeguro.trim(),
      descripcion_validada: r.descripcionValidada,
    })),
    p_subproyectos: limpio.borrador.subproyectos.map((s) => ({
      trabajo_id: s.trabajoId,
      tipo_problema: s.tipo,
      incluido: s.incluido,
      descripcion_seguro: s.descripcionSeguro.trim(),
    })),
    p_media: limpio.borrador.media.map((m) => {
      const meta = limpio.mediaProyecto.get(m.trabajoMediaId)!;
      return {
        trabajo_media_id: m.trabajoMediaId,
        trabajo_id: meta.trabajoId,
        tipo_problema: meta.tipo,
        incluido: m.incluido,
        orden: m.orden,
        es_portada: m.esPortada,
      };
    }),
  });
  if (error || !data) {
    if (tablaAusente(error)) {
      return { ok: false, pendiente: true, error: "Falta aplicar la migración del informe en la base." };
    }
    return { ok: false, error: mensajeGuardado(error) };
  }

  const fila = data as { token?: string; token_activo?: boolean };
  const token = fila.token ?? "";
  const tokenActivo = fila.token_activo === true;
  return {
    ok: true,
    tokenActivo,
    linkPath: token ? `/informe-seguro/${token}` : null,
  };
}

/** Enciende el link que ya existe. No guarda textos ni archivos. */
export async function activarLinkInforme(input: {
  supabase: SupabaseClient;
  eventoId: string;
}): Promise<ResultadoPersistir> {
  const leido = await leerInforme(input.supabase, input.eventoId);
  if (leido.pendiente) {
    return { ok: false, pendiente: true, error: "Falta aplicar la migración del informe en la base." };
  }
  if (!leido.informe) {
    return { ok: false, error: "Guarda los cambios antes de copiar el link." };
  }
  if (!leido.informe.tokenActivo) {
    const { error } = await input.supabase
      .from("informes_seguro")
      .update({ token_activo: true })
      .eq("id", leido.informe.id);
    if (error) return { ok: false, error: error.message };
  }
  return {
    ok: true,
    tokenActivo: true,
    linkPath: `/informe-seguro/${leido.informe.token}`,
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
