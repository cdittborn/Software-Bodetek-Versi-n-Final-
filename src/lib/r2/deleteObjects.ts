import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

function esObjetoInexistente(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  const code = "Code" in err ? String(err.Code) : "";
  return (
    name === "NoSuchKey" ||
    name === "NotFound" ||
    code === "NoSuchKey" ||
    code === "NotFound"
  );
}

export async function borrarObjetoR2(key: string): Promise<void> {
  const client = createR2Client();
  const bucket = getR2BucketName();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key.replace(/^\/+/, ""),
      }),
    );
  } catch (err) {
    if (esObjetoInexistente(err)) return;
    throw err;
  }
}

export async function borrarObjetosR2(keys: Iterable<string | null | undefined>) {
  const unicos = [
    ...new Set(
      [...keys].filter((k): k is string => typeof k === "string" && k.length > 0),
    ),
  ];
  await Promise.all(unicos.map((key) => borrarObjetoR2(key)));
}
