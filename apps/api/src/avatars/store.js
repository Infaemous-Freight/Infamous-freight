/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Module: Avatar Storage Service
 * Purpose: Persistent JSON-based avatar storage for user-uploaded and system avatars
 */

const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} StoredAvatar
 * @property {string} id - Unique avatar identifier
 * @property {string} ownerUserId - User who owns/uploaded this avatar
 * @property {string} name - Display name
 * @property {string} imageUrl - URL to avatar image
 * @property {string} createdAt - ISO timestamp
 */

/**
 * @typedef {Object} AvatarSelection
 * @property {string} type - 'system' or 'user'
 * @property {string} id - Avatar ID (system ID or user avatar ID)
 */

/**
 * @typedef {Object} StoreShape
 * @property {StoredAvatar[]} avatars - All user-uploaded avatars
 * @property {Object<string, AvatarSelection>} selections - User avatar selections
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "avatars.json");

/**
 * Ensure data directory and file exist
 */
function ensure() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ avatars: [], selections: {} }, null, 2));
  }
}

/**
 * Read avatar store from disk
 * @returns {StoreShape}
 */
function read() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    console.error("Failed to read avatar store:", err);
    return { avatars: [], selections: {} };
  }
}

/**
 * Write avatar store to disk
 * @param {StoreShape} store
 */
function write(store) {
  ensure();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("Failed to write avatar store:", err);
  }
}

/**
 * List all avatars for a user
 * @param {string} ownerUserId
 * @returns {StoredAvatar[]}
 */
function listUserAvatars(ownerUserId) {
  return read().avatars.filter((a) => a.ownerUserId === ownerUserId);
}

/**
 * Create a new user-uploaded avatar
 * @param {Omit<StoredAvatar, 'createdAt'>} avatar
 * @returns {StoredAvatar}
 */
function createUserAvatar(avatar) {
  const store = read();
  const created = { ...avatar, createdAt: new Date().toISOString() };
  store.avatars.push(created);
  write(store);
  return created;
}

/**
 * Delete a user avatar
 * @param {string} avatarIdOrFileName - Avatar ID (UUID) or fileName (userId/filename)
 * @param {string} ownerUserId
 * @returns {boolean}
 */
function deleteUserAvatar(avatarIdOrFileName, ownerUserId) {
  const store = read();
  const idx = store.avatars.findIndex(
    (a) =>
      (a.id === avatarIdOrFileName || a.fileName === avatarIdOrFileName) &&
      a.ownerUserId === ownerUserId,
  );
  if (idx < 0) return false;
  store.avatars.splice(idx, 1);
  write(store);
  return true;
}

/**
 * Get a user's current avatar selection
 * @param {string} userId
 * @returns {AvatarSelection|null}
 */
function getSelection(userId) {
  return read().selections[userId] ?? null;
}

/**
 * Set a user's avatar selection
 * @param {string} userId
 * @param {AvatarSelection} selection
 * @returns {AvatarSelection}
 */
function setSelection(userId, selection) {
  const store = read();
  store.selections[userId] = selection;
  write(store);
  return selection;
}

module.exports = {
  listUserAvatars,
  createUserAvatar,
  deleteUserAvatar,
  getSelection,
  setSelection,
  read,
  write,
};
