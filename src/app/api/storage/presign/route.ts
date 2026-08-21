import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

const UUID_RE =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

const presignSchema = z.object({
  nombreArchivo: z.string().min(1),
  tipoArchivo: z.string().min(1),
  carpeta: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9/_-]+$/i,
      "carpeta solo puede incluir letras, números, /, _ y -",
    ),
});

function extensionDeArchivo(nombreArchivo: string): string {
  const parts = nombreArchivo.split(".");
  if (parts.length < 2) return "";
  const ext = parts[parts.length - 1]?.toLowerCase() ?? "";
  if (!/^[a-z0-9]{1,10}$/.test(ext)) return "";
  return `.${ext}`;
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

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

async function autorizarCarpeta(
  supabase: SupabaseServer,
  userId: string,
  carpeta: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
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
        error: "No tienes permiso para subir archivos a este trabajo",
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
    // Insert en recinto_documentos / recinto_planos: solo admin/pablo
    if (!["admin", "pablo"].includes(rol ?? "")) {
      return {
        ok: false,
        status: 403,
        error: "No tienes permiso para subir archivos a este recinto",
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

  if (carpeta === "planos") {
    const rol = await rolUsuario(supabase, userId);
    if (!["admin", "pablo"].includes(rol ?? "")) {
      return {
        ok: false,
        status: 403,
        error: "No tienes permiso para subir planos del complejo",
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    status: 400,
    error: "Carpeta no permitida",
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = presignSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { nombreArchivo, tipoArchivo, carpeta } = parsed.data;
    const carpetaNormalizada = carpeta.replace(/^\/+|\/+$/g, "");

    const authz = await autorizarCarpeta(
      supabase,
      user.id,
      carpetaNormalizada,
    );
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.error },
        { status: authz.status },
      );
    }

    const ext = extensionDeArchivo(nombreArchivo);
    const key = `${carpetaNormalizada}/${randomUUID()}${ext}`;

    const client = createR2Client();
    const bucket = getR2BucketName();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: tipoArchivo,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

    return NextResponse.json({ url, key });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al generar URL prefirmada";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
