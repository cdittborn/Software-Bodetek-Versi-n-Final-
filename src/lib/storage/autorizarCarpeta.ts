import { createClient } from "@/lib/supabase/server";
import { parsearCarpetaFachada } from "@/lib/fachadas/carpetas";

export const UUID_RE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

export type AccionStorage = "subir" | "eliminar";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

type AuthzOk = { ok: true };
type AuthzFail = { ok: false; status: number; error: string };
export type AuthzResult = AuthzOk | AuthzFail;

type ErrorRpc = { code?: string; message?: string } | null;

/** Solo 42883: la función no existe. Cualquier otro error rechaza. */
function funcionAunNoExiste(error: ErrorRpc): boolean {
  return error?.code === "42883";
}

/**
 * true: la ve. false: no la ve. null: la fila no existe.
 * "pendiente": la función todavía no está en la base, y se deja el permiso de hoy.
 */
async function consultarVisibilidad(
  supabase: SupabaseServer,
  fn: "ve_trabajo" | "ve_evento" | "ve_fachadas" | "ve_compra",
  args?: Record<string, string>,
): Promise<boolean | null | "pendiente" | "error"> {
  const { data, error } = await supabase.rpc(fn, args);
  if (funcionAunNoExiste(error)) return "pendiente";
  if (error) return "error";
  if (data === true) return true;
  if (data === false) return false;
  return null;
}

function respuestaVisibilidad(
  visto: boolean | null | "pendiente" | "error",
  mensaje: string,
): AuthzResult | null {
  if (visto === "pendiente" || visto === true) return null;
  if (visto === "error") {
    return { ok: false, status: 500, error: "No se pudo comprobar el acceso" };
  }
  return { ok: false, status: 403, error: mensaje };
}

export {
  parsearCarpetaFachada,
  carpetaFachadaGeneral,
  carpetaFachadaPlano,
  carpetaIntervencionDocs,
  carpetaIntervencionFotos,
  type PrefijoFachada,
} from "@/lib/fachadas/carpetas";

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
  eventoId?: string | null,
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

    const visto = await consultarVisibilidad(supabase, "ve_trabajo", {
      p_trabajo_id: trabajoId,
    });
    const bloqueo = respuestaVisibilidad(visto, mensajeTrabajo(accion));
    if (bloqueo) return bloqueo;
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

    const compraId = compraMatch[1];
    const mensajeCompra =
      accion === "eliminar"
        ? "No tienes permiso para eliminar facturas de materiales"
        : "No tienes permiso para subir facturas de materiales";
    const compra = await consultarVisibilidad(supabase, "ve_compra", {
      p_compra_id: compraId,
    });
    if (compra === "error") {
      return { ok: false, status: 500, error: "No se pudo comprobar el acceso" };
    }
    if (compra === false) return { ok: false, status: 403, error: mensajeCompra };
    if (compra === true || compra === "pendiente") return { ok: true };

    if (!eventoId) {
      return { ok: false, status: 403, error: "Falta el evento de la compra" };
    }
    const evento = await consultarVisibilidad(supabase, "ve_evento", {
      p_evento_id: eventoId,
    });
    const bloqueoEvento = respuestaVisibilidad(evento, mensajeCompra);
    if (bloqueoEvento) return bloqueoEvento;
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

    const visto = await consultarVisibilidad(supabase, "ve_fachadas");
    const bloqueo = respuestaVisibilidad(visto, mensajeFachada(accion));
    if (bloqueo) return bloqueo;
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
