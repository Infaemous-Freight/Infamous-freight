import crypto from "crypto";
import { z } from "zod";
import { env } from "../config/env";
import { presignPutObject } from "../storage/s3";

function extFor(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/webp") return "webp";
  return null;
}

export async function handlePresign(userId: string | null, body: unknown) {
  if (!userId) return { ok: false, error: "Unauthorized" };
  if (env.avatarStorage !== "s3") {
    return { ok: false, error: "presign requires AVATAR_STORAGE=s3" };
  }

  const Schema = z.object({
    name: z.string().min(1).max(60).optional(),
    contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  });

  const input = Schema.parse(body);
  const ext = extFor(input.contentType);
  if (!ext) return { ok: false, error: "Unsupported content type" };

  const id = crypto.randomBytes(16).toString("hex");
  const key = `avatars/users/${userId}/${id}.${ext}`;

  const pres = await presignPutObject({ key, contentType: input.contentType });
  if (!pres.publicUrl) {
    return {
      ok: false,
      error: "S3_PUBLIC_BASE_URL must be set for public URLs",
    };
  }

  return {
    ok: true,
    key,
    name: input.name ?? "My Avatar",
    uploadUrl: pres.uploadUrl,
    publicUrl: pres.publicUrl,
  };
}
