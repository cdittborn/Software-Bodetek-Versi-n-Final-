import { createAdminClient } from "@/lib/supabase/admin";
import { resolverAccesoPublico } from "@/lib/informe-seguro/acceso";
import { clavesDeSnapshot } from "@/lib/informe-seguro/claves";
import { hoyIsoChile } from "@/lib/informe-seguro/fechas";
import { firmarClavesInforme } from "@/lib/informe-seguro/firmar";
import {
  type SnapshotInformeSeguro,
} from "@/lib/informe-seguro/snapshot";

function esSnapshot(value: unknown): value is SnapshotInformeSeguro {
  if (!value || typeof value !== "object") return false;
  const v = value as SnapshotInformeSeguro;
  return (
    v.version === 1 &&
    Array.isArray(v.recintos) &&
    Array.isArray(v.cotizaciones) &&
    v.encabezado != null &&
    v.resumen != null
  );
}

/**
 * Lee solo la última versión publicada del token.
 * No consulta el borrador ni las tablas de trabajos.
 */
export async function cargarVistaPublica(token: string): Promise<{
  snapshot: SnapshotInformeSeguro;
  urls: Record<string, string>;
} | null> {
  if (!token || token.length < 32) return null;

  const admin = createAdminClient();
  const { data: informe } = await admin
    .from("informes_seguro")
    .select("id, token_activo, token_expira")
    .eq("token", token)
    .maybeSingle();

  const hoy = hoyIsoChile();
  const fila = informe as {
    id: string;
    token_activo: boolean;
    token_expira: string | null;
  } | null;

  if (
    resolverAccesoPublico({
      encontrado: Boolean(fila),
      tokenActivo: fila?.token_activo === true,
      tokenExpira: fila?.token_expira ?? null,
      hoy,
      hayVersion: true,
    }) !== "ok" ||
    !fila
  ) {
    return null;
  }

  const { data: version } = await admin
    .from("informe_seguro_versiones")
    .select("contenido, numero")
    .eq("informe_id", fila.id)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  const contenido = (version as { contenido?: unknown } | null)?.contenido;
  if (
    resolverAccesoPublico({
      encontrado: true,
      tokenActivo: true,
      tokenExpira: fila.token_expira,
      hoy,
      hayVersion: esSnapshot(contenido),
    }) !== "ok" ||
    !esSnapshot(contenido)
  ) {
    return null;
  }

  const urls: Record<string, string> = {};
  try {
    const firmadas = await firmarClavesInforme(clavesDeSnapshot(contenido));
    for (const [key, url] of firmadas) urls[key] = url;
  } catch (error) {
    console.error("[informe-seguro] no se pudieron firmar las fotos", {
      nombre: error instanceof Error ? error.name : "Error",
    });
  }

  return { snapshot: contenido, urls };
}
