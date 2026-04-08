import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";

function requireEnv(value: string | undefined | null, name: string) {
  if (!value || String(value).trim() === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return String(value);
}

export function createS3Client() {
  return new S3Client({
    region: env.s3Region || "auto",
    endpoint: env.s3Endpoint || undefined,
    credentials:
      env.s3AccessKeyId && env.s3SecretAccessKey
        ? {
            accessKeyId: String(env.s3AccessKeyId),
            secretAccessKey: String(env.s3SecretAccessKey),
          }
        : undefined,
    forcePathStyle: true,
  });
}

export async function presignPutObject(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const Bucket = requireEnv(env.s3Bucket, "S3_BUCKET");

  const client = createS3Client();
  const command = new PutObjectCommand({
    Bucket,
    Key: params.key,
    ContentType: params.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 120,
  });

  const base = env.s3PublicBaseUrl ? String(env.s3PublicBaseUrl).replace(/\/+$/, "") : null;
  const publicUrl = base ? `${base}/${params.key}` : null;

  return { uploadUrl, publicUrl };
}
