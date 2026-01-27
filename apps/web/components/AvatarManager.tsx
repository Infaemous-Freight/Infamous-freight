"use client";

import React, { useEffect, useMemo, useState } from "react";

// System avatar from manifest
interface SystemAvatar {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
}

// User-uploaded avatar from API
interface UserAvatar {
  fileName: string; // userId/filename
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  selected: boolean;
}

interface ApiMeResponse {
  success?: boolean;
  avatars?: UserAvatar[];
  selected?: UserAvatar | null;
}

const red = {
  bg: "#1c0a0a",
  panel: "#250d0d",
  border: "rgba(255,64,64,0.35)",
  borderActive: "rgba(255,64,64,0.9)",
  text: "#f8f4f4",
  sub: "rgba(255,255,255,0.72)",
  accent: "#ff4040",
  accentSoft: "rgba(255,64,64,0.08)",
};

const cardStyle = (active: boolean) => ({
  border: active ? `2px solid ${red.borderActive}` : `1px solid ${red.border}`,
  background: red.panel,
  borderRadius: 14,
  padding: 12,
  textAlign: "left" as const,
  transition: "border-color 120ms ease, transform 120ms ease",
  transform: active ? "translateY(-2px)" : undefined,
});

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

export default function AvatarManager() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const [systemAvatars, setSystemAvatars] = useState<SystemAvatar[]>([]);
  const [userAvatars, setUserAvatars] = useState<UserAvatar[]>([]);
  const [selected, setSelected] = useState<UserAvatar | null>(null);
  const [token, setToken] = useState<string>("");
  const [userIdInput, setUserIdInput] = useState<string>("demo-user");
  const [signingIn, setSigningIn] = useState(false);
  const [name, setName] = useState<string>("My Avatar");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Load persisted token (dev helper)
  useEffect(() => {
    const cached = window.localStorage.getItem("avatarToken");
    if (cached) setToken(cached);
  }, []);

  useEffect(() => {
    if (token) window.localStorage.setItem("avatarToken", token);
  }, [token]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );

  async function signInDev() {
    const desiredId = userIdInput.trim() || "demo-user";
    setSigningIn(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`${apiBase}/v1/auth/dev-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: desiredId }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false || !json.token) {
        throw new Error(
          json.error || json.message || "Failed to get dev token",
        );
      }
      setToken(json.token);
      setInfo(`Signed in as ${desiredId}`);
    } catch (err) {
      setError((err as Error).message || "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  const buildUserImageUrl = (fileName: string) =>
    `${apiBase}/uploads/${fileName}`;

  async function refresh() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      // System avatars (public)
      const sysRes = await fetch(`${apiBase}/v1/avatars/system`);
      const sysJson = await sysRes.json();
      setSystemAvatars(
        sysJson.avatars || sysJson.featured || sysJson?.data?.featured || [],
      );

      if (!authHeaders) {
        setInfo("Add a JWT to upload and select your personal avatar.");
        setUserAvatars([]);
        setSelected(null);
        return;
      }

      // User avatars (requires auth)
      const meRes = await fetch(`${apiBase}/v1/avatars/me`, {
        headers: authHeaders,
      });
      if (!meRes.ok) {
        const txt = await meRes.text();
        throw new Error(`/v1/avatars/me failed: ${txt || meRes.status}`);
      }
      const meJson: ApiMeResponse = await meRes.json();
      const avatars = meJson.avatars || [];
      setUserAvatars(avatars);
      setSelected(meJson.selected || null);
    } catch (err) {
      setError((err as Error).message || "Failed to load avatars");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch((err) => setError((err as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function upload(file: File) {
    if (!authHeaders) {
      setError("Add a JWT token before uploading.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      fd.append("name", name || file.name);

      const res = await fetch(`${apiBase}/v1/avatars/me/upload`, {
        method: "POST",
        headers: authHeaders,
        body: fd,
      });

      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.message || body?.error || "Upload failed");
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function selectAvatar(fileName: string) {
    if (!authHeaders) {
      setError("Add a JWT token before selecting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiBase}/v1/avatars/me/select/${encodeURIComponent(fileName)}`,
        {
          method: "POST",
          headers: authHeaders,
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.message || body?.error || "Select failed");
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Select failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAvatar(fileName: string) {
    if (!authHeaders) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiBase}/v1/avatars/me/${encodeURIComponent(fileName)}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );
      const body = await res.json();
      if (!res.ok)
        throw new Error(body?.message || body?.error || "Delete failed");
      await refresh();
    } catch (err) {
      setError((err as Error).message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: red.bg,
        color: red.text,
        fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0 }}>Avatar Settings</h1>
          <p style={{ margin: 0, color: red.sub }}>
            Choose a main avatar (system defaults) or upload a personal avatar.
            JWT is required for uploads and selection.
          </p>
        </header>

        <section style={{ marginTop: 16, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: red.sub, fontSize: 13 }}>
                JWT token (with user:avatar scope)
              </span>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${red.border}`,
                  background: red.panel,
                  color: red.text,
                  fontFamily: "inherit",
                }}
              />
            </label>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="user id (dev)"
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${red.border}`,
                  background: red.panel,
                  color: red.text,
                  fontFamily: "inherit",
                  minWidth: 200,
                }}
              />
              <button
                onClick={signInDev}
                disabled={signingIn}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${red.borderActive}`,
                  background: red.accentSoft,
                  color: red.text,
                  cursor: signingIn ? "not-allowed" : "pointer",
                  opacity: signingIn ? 0.6 : 1,
                }}
              >
                {signingIn ? "Signing in..." : "Get dev token"}
              </button>
              <span style={{ color: red.sub, fontSize: 12 }}>
                Uses /v1/auth/dev-token (dev-only) and stores in localStorage.
              </span>
            </div>
          </div>
        </section>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${red.borderActive}`,
              background: red.accentSoft,
              color: red.text,
            }}
          >
            <strong style={{ color: red.accent }}>Error:</strong> {error}
          </div>
        )}

        {info && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${red.border}`,
              background: red.panel,
              color: red.sub,
            }}
          >
            {info}
          </div>
        )}

        <section style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, color: red.accent }}>Main Avatars</h2>
            {loading && (
              <span style={{ color: red.sub, fontSize: 13 }}>Loading…</span>
            )}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginTop: 12,
            }}
          >
            {systemAvatars.map((a) => (
              <article key={a.id} style={cardStyle(false)}>
                <img
                  src={a.imageUrl}
                  alt={a.name}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: `1px solid ${red.border}`,
                  }}
                />
                <div style={{ marginTop: 10, fontWeight: 700 }}>{a.name}</div>
                <div style={{ color: red.sub, fontSize: 13 }}>
                  {a.description || a.id}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, color: red.accent }}>Personal Avatars</h2>
            {!authHeaders && (
              <span style={{ color: red.sub, fontSize: 13 }}>
                Add a token to manage your avatars.
              </span>
            )}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avatar name"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${red.border}`,
                background: red.panel,
                color: red.text,
                minWidth: 220,
              }}
            />
            <label
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${red.borderActive}`,
                background: red.accentSoft,
                color: red.text,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              Upload
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                disabled={busy || !authHeaders}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <span style={{ color: red.sub, fontSize: 12 }}>
              PNG/JPEG/WebP • Max 5-6 MB (API enforced)
            </span>
          </div>

          {userAvatars.length === 0 ? (
            <p style={{ marginTop: 12, color: red.sub }}>
              {authHeaders
                ? "No personal avatars yet. Upload one above."
                : "Provide a token to load your avatars."}
            </p>
          ) : (
            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {userAvatars.map((a) => {
                const active = selected?.fileName === a.fileName;
                return (
                  <article key={a.fileName} style={cardStyle(active)}>
                    <img
                      src={buildUserImageUrl(a.fileName)}
                      alt={a.fileName}
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 10,
                        border: `1px solid ${red.border}`,
                      }}
                    />
                    <div style={{ marginTop: 8, fontWeight: 700 }}>
                      {a.fileName.split("/").pop()}
                    </div>
                    <div style={{ color: red.sub, fontSize: 12 }}>
                      {new Date(a.uploadedAt).toLocaleString()} •{" "}
                      {formatBytes(a.fileSize)}
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                      <button
                        onClick={() => selectAvatar(a.fileName)}
                        disabled={busy || !authHeaders}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: `1px solid ${red.borderActive}`,
                          background: active ? red.accent : red.panel,
                          color: red.text,
                          cursor: busy ? "not-allowed" : "pointer",
                        }}
                      >
                        {active ? "Selected" : "Select"}
                      </button>
                      <button
                        onClick={() => deleteAvatar(a.fileName)}
                        disabled={busy || !authHeaders}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: `1px solid ${red.border}`,
                          background: "transparent",
                          color: red.sub,
                          cursor: busy ? "not-allowed" : "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
