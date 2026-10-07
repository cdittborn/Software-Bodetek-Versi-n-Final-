import { createAdminClient } from "@/lib/supabase/admin";
import { resolverAccesoPublico } from "@/lib/informe-seguro/acceso";
import { claveFirmaSegura } from "@/lib/informe-seguro/claves";
import { firmarClavesInforme } from "@/lib/informe-seguro/firmar";
import {
  fuenteDesdeProyectos,
  type ProyectoInformeInput,
} from "@/lib/informe-seguro/fuente";
import { parseProblemas } from "@/lib/filtracion/problemas";
import {
  combinarBorrador,
  type BorradorInforme,
  type EncabezadoInforme,
} from "@/lib/informe-seguro/snapshot";
import { armarVistaLiquidador } from "@/lib/informe-seguro/vista";
import type { FuenteProyecto } from "@/lib/informe-seguro/fuente";

const ENCABEZADO_VACIO: EncabezadoInforme = {
  nombre: "",
  nombreEvento: "",
  fechaEvento: null,
  direccionCentro: "",
  numeroSiniestro: null,
  numeroPoliza: null,
  contactoBodetek: "",
  fechaEmision: null,
};

export type VistaPublicaInforme = {
  fuente: FuenteProyecto[];
  borrador: BorradorInforme;
  urls: Record<string, string>;
};

/**
 * Lee el informe guardado del token y las fotos actuales de la ficha.
 * No usa una versión congelada. No manda el plan de acción ni archivos ocultos.
 */
export async function cargarVistaPublica(token: string): Promise<VistaPublicaInforme | null> {
  if (!token || token.length < 32) return null;

  const admin = createAdminClient();
  const { data: informe } = await admin
    .from("informes_seguro")
    .select("id, evento_id, token_activo")
    .eq("token", token)
    .maybeSingle();

  const fila = informe as {
    id: string;
    evento_id: string;
    token_activo: boolean;
  } | null;

  if (
    resolverAccesoPublico({
      encontrado: Boolean(fila),
      tokenActivo: fila?.token_activo === true,
    }) !== "ok" ||
    !fila
  ) {
    return null;
  }

  const { data: trabajos } = await admin
    .from("trabajos")
    .select(
      "id, titulo, codigo_filtracion, problemas, recintos ( codigo, nombre, arrendatario_actual )",
    )
    .eq("evento_id", fila.evento_id);

  const filas = (trabajos ?? []) as {
    id: string;
    titulo: string | null;
    codigo_filtracion: string | null;
    problemas: unknown;
    recintos:
      | { codigo: string | null; nombre: string | null; arrendatario_actual: string | null }
      | { codigo: string | null; nombre: string | null; arrendatario_actual: string | null }[]
      | null;
  }[];
  const ids = filas.map((t) => t.id);
  const mediaPorTrabajo = new Map<string, ProyectoInformeInput["media"]>();
  if (ids.length > 0) {
    const { data: media } = await admin
      .from("trabajo_media")
      .select("id, trabajo_id, tipo, tipo_archivo, url, thumbnail_key, nombre_archivo, created_at, problema_tipo")
      .in("trabajo_id", ids)
      .in("tipo", ["antes", "despues"])
      .in("tipo_archivo", ["foto", "video"]);
    for (const item of (media ?? []) as {
      id: string;
      trabajo_id: string;
      tipo: string;
      tipo_archivo: string;
      url: string;
      thumbnail_key: string | null;
      nombre_archivo: string | null;
      created_at: string;
      problema_tipo: string | null;
    }[]) {
      const bucket = mediaPorTrabajo.get(item.trabajo_id) ?? { antes: [], despues: [] };
      const filaMedia = {
        id: item.id,
        tipo_archivo: item.tipo_archivo,
        url: item.url,
        thumbnail_key: item.thumbnail_key,
        nombre_archivo: item.nombre_archivo,
        created_at: item.created_at,
        problema_tipo: item.problema_tipo,
      };
      if (item.tipo === "despues") bucket.despues.push(filaMedia);
      else bucket.antes.push(filaMedia);
      mediaPorTrabajo.set(item.trabajo_id, bucket);
    }
  }

  const proyectos: ProyectoInformeInput[] = filas.map((t) => {
    const recinto = Array.isArray(t.recintos) ? t.recintos[0] : t.recintos;
    return {
      id: t.id,
      titulo: t.titulo,
      codigo_filtracion: t.codigo_filtracion,
      recinto_codigo: recinto?.codigo ?? null,
      recinto_nombre: recinto?.nombre ?? null,
      recinto_arrendatario: recinto?.arrendatario_actual ?? null,
      descripcion: null,
      plan_accion: null,
      problemas: parseProblemas(t.problemas),
      media: mediaPorTrabajo.get(t.id) ?? { antes: [], despues: [] },
    };
  });

  const [recintos, subproyectos, mediaInforme] = await Promise.all([
    admin
      .from("informe_seguro_recintos")
      .select("trabajo_id, incluido, descripcion_seguro, descripcion_validada")
      .eq("informe_id", fila.id),
    admin
      .from("informe_seguro_subproyectos")
      .select("trabajo_id, tipo_problema, incluido, descripcion_seguro")
      .eq("informe_id", fila.id),
    admin
      .from("informe_seguro_media")
      .select("trabajo_media_id, incluido, orden, es_portada")
      .eq("informe_id", fila.id),
  ]);
  if (recintos.error || subproyectos.error || mediaInforme.error) return null;

  const fuente = fuenteDesdeProyectos(proyectos, []);
  const guardado: BorradorInforme = {
    encabezado: ENCABEZADO_VACIO,
    tokenExpira: null,
    recintos: ((recintos.data ?? []) as {
      trabajo_id: string;
      incluido: boolean;
      descripcion_seguro: string;
      descripcion_validada: boolean;
    }[]).map((r) => ({
      trabajoId: r.trabajo_id,
      incluido: r.incluido,
      descripcionSeguro: r.descripcion_seguro ?? "",
      descripcionValidada: r.descripcion_validada === true,
      version: null,
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
    media: ((mediaInforme.data ?? []) as {
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
  };
  const borrador = combinarBorrador(fuente, guardado, ENCABEZADO_VACIO);
  const vista = armarVistaLiquidador(fuente, borrador);
  const claves = [
    ...new Set(
      vista.fuente.flatMap((p) =>
        p.media.flatMap((m) => [m.key, m.thumbnailKey].filter((k): k is string => Boolean(k))),
      ),
    ),
  ].filter(claveFirmaSegura);

  const urls: Record<string, string> = {};
  try {
    const firmadas = await firmarClavesInforme(claves);
    for (const [clave, url] of firmadas) urls[clave] = url;
  } catch (error) {
    console.error(
      "informe-seguro firma",
      error instanceof Error ? error.name : "error",
    );
  }

  return { fuente: vista.fuente, borrador: vista.borrador, urls };
}
