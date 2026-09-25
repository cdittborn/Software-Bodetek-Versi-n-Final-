import { createClient } from "@/lib/supabase/server";

export const UUID_RE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

export type AccionStorage = "subir" | "eliminar";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

type AuthzOk = { ok: true };
type AuthzFail = { ok: false; status: number; error: string };
export type AuthzResult = AuthzOk | AuthzFail;

export type PrefijoFachada =
  | { kind: "general" | "plano"; fachadaId: string }
  | { kind: "fotos" | "docs"; fachadaId: string; intervencionId: string };

const FACHADA_GENERAL_RE = new RegExp(`^fachadas/(${UUID_RE})/general$`, "i");
const FACHADA_PLANO_RE = new RegExp(`^fachadas/(${UUID_RE})/plano$`, "i");
const FACHADA_FOTOS_RE = new RegExp(
  `^fachadas/(${UUID_RE})/intervenciones/(${UUID_RE})/fotos$`,
  "i",
);
const FACHADA_DOCS_RE = new RegExp(
  `^fachadas/(${UUID_RE})/intervenciones/(${UUID_RE})/docs$`,
  "i",
);

export function parsearCarpetaFachada(carpeta: string): PrefijoFachada | null {
  const general = FACHADA_GENERAL_RE.exec(carpeta);
  if (general) return { kind: "general", fachadaId: general[1] };
  const plano = FACHADA_PLANO_RE.exec(carpeta);
  if (plano) return { kind: "plano", fachadaId: plano[1] };
  const fotos = FACHADA_FOTOS_RE.exec(carpeta);
  if (fotos) {
    return { kind: "fotos", fachadaId: fotos[1], intervencionId: fotos[2] };
  }
  const docs = FACHADA_DOCS_RE.exec(carpeta);
  if (docs) {
    return { kind: "docs", fachadaId: docs[1], intervencionId: docs[2] };
  }
  return null;
}

export function carpetaFachadaGeneral(fachadaId: string): string {
  return `fachadas/${fachadaId}/general`;
}

export function carpetaFachadaPlano(fachadaId: string): string {
  return `fachadas/${fachadaId}/plano`;
}

export function carpetaIntervencionFotos(
  fachadaId: string,
  intervencionId: string,
): string {
  return `fachadas/${fachadaId}/intervenciones/${intervencionId}/fotos`;
}

export function carpetaIntervencionDocs(
  fachadaId: string,
  intervencionId: string,
): string {
  return `fachadas/${fachadaId}/intervenciones/${intervencionId}/docs`;
}

function mensajeFachada(accion: AccionStorage): string {
  return accion === "eliminar"
    ? "No tienes permiso para eliminar archivos de esta fachada"
    : "No tienes permiso para subir archivos a esta fachada";
}

function mensajeTrabajo(accion: AccionStorage): string {
  return accion === "eliminar"
    ? "No tienes permiso para eliminar archivos de este trabajo"
    : "No tienes permiso para subir archivos a este trabajo";
}

async function rolUsuario(
  supabase: SupabaseServer,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", userId)
    .maybeSingle();
  return data?.rol ?? null;
}

export async function autorizarCarpeta(
  supabase: SupabaseServer,
  userId: string,
  carpeta: string,
  accion: AccionStorage = "subir",
): Promise<AuthzResult> {
  const trabajoMatch = new RegExp(`^trabajos/(${UUID_RE})$`, "i").exec(carpeta);
  if (trabajoMatch) {
    const trabajoId = trabajoMatch[1];
    const { data: trabajo } = await supabase
      .from("trabajos")
      .select("id, categoria_id")
      .eq("id", trabajoId)
      .maybeSingle();

    if (!trabajo) {
      return {
        ok: false,
        status: 403,
        error: "Trabajo no encontrado o sin acceso",
      };
    }

    const [{ data: esPrivada }, { data: esDueno }, rol] = await Promise.all([
      supabase.rpc("categoria_es_privada", {
        p_categoria_id: trabajo.categoria_id,
      }),
      supabase.rpc("soy_dueno_categoria", {
        p_categoria_id: trabajo.categoria_id,
      }),
      rolUsuario(supabase, userId),
    ]);

    const puedeEscribir = esPrivada
      ? Boolean(esDueno)
      : ["admin", "pablo", "asistente"].includes(rol ?? "");

    if (!puedeEscribir) {
      return {
        ok: false,
        status: 403,
        error: mensajeTrabajo(accion),
      };
    }
    return { ok: true };
  }

  const recintoMatch = new RegExp(
    `^recintos/(${UUID_RE})/(documentos|planos)$`,
    "i",
  ).exec(carpeta);
  if (recintoMatch) {
    const recintoId = recintoMatch[1];
    const rol = await rolUsuario(supabase, userId);
    if (!["admin", "pablo"].includes(rol ?? "")) {
      return {
        ok: false,
        status: 403,
        error:
          accion === "eliminar"
            ? "No tienes permiso para eliminar archivos de este recinto"
            : "No tienes permiso para subir archivos a este recinto",
      };
    }
    const { data: recinto } = await supabase
      .from("recintos")
      .select("id")
      .eq("id", recintoId)
      .maybeSingle();
    if (!recinto) {
      return {
        ok: false,
        status: 403,
        error: "Recinto no encontrado o sin acceso",
      };
    }
    return { ok: true };
  }

  const compraMatch = new RegExp(`^compras/(${UUID_RE})$`, "i").exec(carpeta);
  if (compraMatch) {
    const rol = await rolUsuario(supabase, userId);
    if (!["admin", "pablo", "asistente"].includes(rol ?? "")) {
      return {
        ok: false,
        status: 403,
        error:
          accion === "eliminar"
            ? "No tienes permiso para eliminar facturas de materiales"
            : "No tienes permiso para subir facturas de materiales",
      };
    }
    return { ok: true };
  }

  if (carpeta === "planos") {
    const rol = await rolUsuario(supabase, userId);
    if (!["admin", "pablo"].includes(rol ?? "")) {
      return {
        ok: false,
        status: 403,
        error:
          accion === "eliminar"
            ? "No tienes permiso para eliminar planos del complejo"
            : "No tienes permiso para subir planos del complejo",
      };
    }
    return { ok: true };
  }

  const fachadaCarpeta = parsearCarpetaFachada(carpeta);
  if (fachadaCarpeta) {
    const rol = await rolUsuario(supabase, userId);
    if (!["admin", "pablo", "asistente"].includes(rol ?? "")) {
      return {
        ok: false,
        status: 403,
        error: mensajeFachada(accion),
      };
    }

    const { data: fachada } = await supabase
      .from("fachadas")
      .select("id")
      .eq("id", fachadaCarpeta.fachadaId)
      .maybeSingle();
    if (!fachada) {
      return {
        ok: false,
        status: 403,
        error: "Fachada no encontrada o sin acceso",
      };
    }

    if (fachadaCarpeta.kind === "fotos" || fachadaCarpeta.kind === "docs") {
      const { data: intervencion } = await supabase
        .from("fachada_intervenciones")
        .select("id, fachada_id")
        .eq("id", fachadaCarpeta.intervencionId)
        .maybeSingle();
      if (
        !intervencion ||
        intervencion.fachada_id !== fachadaCarpeta.fachadaId
      ) {
        return {
          ok: false,
          status: 403,
          error: "Intervención no encontrada o sin acceso",
        };
      }
    }

    return { ok: true };
  }

  return {
    ok: false,
    status: 400,
    error: "Carpeta no permitida",
  };
}

export function carpetaTrabajo(trabajoId: string): string {
  return `trabajos/${trabajoId}`;
}

export function carpetaCompra(compraId: string): string {
  return `compras/${compraId}`;
}

export function keyPerteneceACarpeta(key: string, carpeta: string): boolean {
  const prefijo = `${carpeta.replace(/^\/+|\/+$/g, "")}/`;
  const normalizada = key.replace(/^\/+/, "");
  return (
    normalizada.startsWith(prefijo) &&
    !normalizada.includes("..") &&
    normalizada.length > prefijo.length
  );
}
