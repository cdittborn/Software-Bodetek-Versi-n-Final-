import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { claveFirmaSegura } from "@/lib/informe-seguro/claves";
import { createR2Client, getR2BucketName } from "@/lib/r2/client";

export const TTL_URL_INFORME_SEGUNDOS = 2 * 60 * 60;

export async function firmarClavesInforme(
  claves: string[],
): Promise<Map<string, string>> {
  const unicas = [...new Set(claves.filter(claveFirmaSegura))];
  const map = new Map<string, string>();
  if (unicas.length === 0) return map;

  const client = createR2Client();
  const bucket = getR2BucketName();
  await Promise.all(
    unicas.map(async (key) => {
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: TTL_URL_INFORME_SEGUNDOS },
      );
      map.set(key, url);
    }),
  );
  return map;
}
