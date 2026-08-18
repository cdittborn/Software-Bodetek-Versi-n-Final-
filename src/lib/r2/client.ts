import { S3Client } from "@aws-sdk/client-s3";

/**
 * Cliente S3 apuntando a Cloudflare R2.
 * SOLO usar en servidor (Route Handlers, Server Actions).
 * Nunca importar desde componentes "use client".
 */
export function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Faltan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export function getR2BucketName() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Falta R2_BUCKET_NAME");
  }
  return bucket;
}
