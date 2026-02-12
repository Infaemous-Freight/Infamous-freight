/**
 * Avatar Store - JSON Persistence Layer
 * Manages user avatars with CI-safe disk storage at apps/api/data/avatars.json
 *
 * Features:
 * - Atomic writes to prevent corruption
 * - Auto-creates missing store file
 * - Type-safe operations
 * - Per-user avatar tracking
 */

import * as fs from "fs";
import * as path from "path";
import { env } from "../config/env";

export interface UserAvatar {
  userId: string;
  uploadedAt: string; // ISO timestamp
  fileName: string; // Relative path or remote URL
  fileSize: number; // Bytes (0 for remote)
  mimeType: string;
  selected: boolean; // Is this the active avatar?
  storage?: "local" | "s3";
  url?: string; // public URL (for s3)
  name?: string; // display name
}

export interface AvatarStore {
  version: string;
  createdAt: string;
  avatars: UserAvatar[];
}

// Singleton instance
let store: AvatarStore | null = null;

/**
 * Initialize avatar store from disk
 * Creates if doesn't exist
 */
export async function initializeStore(): Promise<AvatarStore> {
  const storeDir = path.dirname(env.avatarDataStore);

  // Create directory if missing
  if (!fs.existsSync(storeDir)) {
    fs.mkdirSync(storeDir, { recursive: true });
  }

  // Load or create store
  if (fs.existsSync(env.avatarDataStore)) {
    try {
      const data = fs.readFileSync(env.avatarDataStore, "utf-8");
      store = JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse avatar store, creating fresh:", error);
      store = createFreshStore();
      saveStore();
    }
  } else {
    store = createFreshStore();
    saveStore();
  }

  return store!;
}

function createFreshStore(): AvatarStore {
  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    avatars: [],
  };
}

/**
 * Atomically save store to disk
 * Writes to temp file first, then renames (prevents corruption)
 */
function saveStore(): void {
  if (!store) throw new Error("Store not initialized");

  const storeDir = path.dirname(env.avatarDataStore);
  const tempPath = path.join(storeDir, ".avatars.tmp");

  try {
    // Write to temp file
    fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), "utf-8");

    // Atomic rename
    fs.renameSync(tempPath, env.avatarDataStore);
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw error;
  }
}

/**
 * Get all avatars for a user
 */
export async function getUserAvatars(userId: string): Promise<UserAvatar[]> {
  await ensureInitialized();
  return store!.avatars.filter((a) => a.userId === userId);
}

/**
 * Get selected avatar for a user
 */
export async function getSelectedAvatar(
  userId: string,
): Promise<UserAvatar | null> {
  await ensureInitialized();
  const avatars = store!.avatars.filter((a) => a.userId === userId);
  return avatars.find((a) => a.selected) || null;
}

/**
 * Add new avatar to store
 */
export async function addAvatar(avatar: UserAvatar): Promise<void> {
  await ensureInitialized();

  // Deselect other avatars if this one is selected
  if (avatar.selected) {
    store!.avatars.forEach((a) => {
      if (a.userId === avatar.userId) {
        a.selected = false;
      }
    });
  }

  store!.avatars.push(avatar);
  saveStore();
}

/**
 * Select an avatar (deselect others for same user)
 */
export async function selectAvatar(
  userId: string,
  fileName: string,
): Promise<UserAvatar | null> {
  await ensureInitialized();

  // Find avatar
  const avatar = store!.avatars.find(
    (a) => a.userId === userId && a.fileName === fileName,
  );

  if (!avatar) return null;

  // Deselect others
  store!.avatars.forEach((a) => {
    if (a.userId === userId) {
      a.selected = false;
    }
  });

  // Select this one
  avatar.selected = true;
  saveStore();

  return avatar;
}

/**
 * Delete avatar from store
 */
export async function deleteAvatar(
  userId: string,
  fileName: string,
): Promise<boolean> {
  await ensureInitialized();

  const index = store!.avatars.findIndex(
    (a) => a.userId === userId && a.fileName === fileName,
  );

  if (index === -1) return false;

  store!.avatars.splice(index, 1);
  saveStore();

  return true;
}

/**
 * Get store stats
 */
export async function getStoreStats(): Promise<{
  totalAvatars: number;
  totalUsers: number;
  storeSize: string;
}> {
  await ensureInitialized();

  const uniqueUsers = new Set(store!.avatars.map((a) => a.userId));
  const storeSize = store ? JSON.stringify(store).length : 0;

  return {
    totalAvatars: store!.avatars.length,
    totalUsers: uniqueUsers.size,
    storeSize: formatBytes(storeSize),
  };
}

/**
 * Ensure store is initialized before operations
 */
async function ensureInitialized(): Promise<void> {
  if (!store) {
    await initializeStore();
  }
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB"];
  let size = bytes;
  let unitIdx = 0;
  while (size >= 1024 && unitIdx < units.length - 1) {
    size /= 1024;
    unitIdx++;
  }
  return `${size.toFixed(2)} ${units[unitIdx]}`;
}
