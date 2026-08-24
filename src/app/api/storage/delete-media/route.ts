import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { borrarObjetosR2 } from "@/lib/r2/deleteObjects";
import {
  autorizarCarpeta,
  carpetaTrabajo,
  keyPerteneceACarpeta,
} from "@/lib/storage/autorizarCarpeta";

const deleteMediaSchema = z.object({
  mediaId: z.string().uuid(),
});

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
    const parsed = deleteMediaSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { mediaId } = parsed.data;

    const { data: media, error: fetchError } = await supabase
      .from("trabajo_media")
      .select("id, url, thumbnail_key, trabajo_id")
      .eq("id", mediaId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!media?.trabajo_id || !media.url) {
      return NextResponse.json(
        { error: "Archivo no encontrado o sin acceso" },
        { status: 404 },
      );
    }

    const carpeta = carpetaTrabajo(media.trabajo_id);

    const authz = await autorizarCarpeta(
      supabase,
      user.id,
      carpeta,
      "eliminar",
    );
    if (!authz.ok) {
      return NextResponse.json(
        { error: authz.error },
        { status: authz.status },
      );
    }

    if (!keyPerteneceACarpeta(media.url, carpeta)) {
      return NextResponse.json(
        { error: "Ruta de almacenamiento inválida" },
        { status: 400 },
      );
    }

    if (
      media.thumbnail_key &&
      !keyPerteneceACarpeta(media.thumbnail_key, carpeta)
    ) {
      return NextResponse.json(
        { error: "Ruta de miniatura inválida" },
        { status: 400 },
      );
    }

    await borrarObjetosR2([media.url, media.thumbnail_key]);

    const { error: deleteError } = await supabase
      .from("trabajo_media")
      .delete()
      .eq("id", mediaId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al eliminar el archivo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
