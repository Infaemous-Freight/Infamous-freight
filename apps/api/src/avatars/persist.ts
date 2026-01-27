import crypto from "crypto";
import { getPrisma } from "../db/prisma";
import type { Avatar as StoredAvatar, AvatarSelection } from "./store";
import * as json from "./store";

export async function ensureUser(userId: string) {
  const p = getPrisma();
  if (!p) return;

  await p.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
}

export async function listUserAvatars(userId: string): Promise<StoredAvatar[]> {
  const p = getPrisma();
  if (!p) return json.getUserAvatars(userId);

  await ensureUser(userId);
  const rows = await p.avatar.findMany({
    where: { ownerUserId: userId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    ownerUserId: r.ownerUserId,
    fileName: r.imageUrl,
    name: r.name,
    url: r.imageUrl,
    type: "user" as const,
    uploadedAt: r.createdAt.toISOString(),
  }));
}

export async function createUserAvatar(
  userId: string,
  name: string,
  imageUrl: string,
): Promise<StoredAvatar> {
  const p = getPrisma();
  if (!p)
    return json.addAvatar(userId, {
      id: `av_${crypto.randomBytes(10).toString("hex")}`,
      fileName: imageUrl,
      name,
      type: "user",
      uploadedAt: new Date().toISOString(),
    });

  await ensureUser(userId);
  const id = `av_${crypto.randomBytes(10).toString("hex")}`;
  const created = await p.avatar.create({
    data: {
      id,
      ownerUserId: userId,
      name,
      imageUrl,
    },
  });

  return {
    id: created.id,
    ownerUserId: created.ownerUserId,
    fileName: created.imageUrl,
    name: created.name,
    url: created.imageUrl,
    type: "user" as const,
    uploadedAt: created.createdAt.toISOString(),
  };
}

export async function getSelection(
  userId: string,
): Promise<AvatarSelection | null> {
  const p = getPrisma();
  if (!p) return json.getSelectedAvatar(userId);

  await ensureUser(userId);
  const row = await p.avatarSelection.findUnique({
    where: { userId },
  });

  if (!row) return null;

  if (row.type === "system") {
    return { fileName: row.systemId ?? "main-01", type: "system" };
  }
  return { fileName: row.avatarId ?? "", type: "user" };
}

export async function setSelection(
  userId: string,
  selection: AvatarSelection,
): Promise<AvatarSelection> {
  const p = getPrisma();
  if (!p) return json.selectAvatar(userId, selection);

  await ensureUser(userId);

  await p.avatarSelection.upsert({
    where: { userId },
    update: {
      type: selection.type,
      systemId: selection.type === "system" ? selection.fileName : null,
      avatarId: selection.type === "user" ? selection.fileName : null,
    },
    create: {
      userId,
      type: selection.type,
      systemId: selection.type === "system" ? selection.fileName : null,
      avatarId: selection.type === "user" ? selection.fileName : null,
    },
  });

  return selection;
}
