import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

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
