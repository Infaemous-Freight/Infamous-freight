/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Component: Avatar Selector
 * Purpose: Display system avatars and user-uploaded avatars with selection UI
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  type?: "system" | "user";
}

interface AvatarSelection {
  type: "system" | "user";
  id: string;
}

interface AvatarSelectorProps {
  token?: string;
  onSelectionChange?: (selection: AvatarSelection) => void;
  showUpload?: boolean;
}

export function AvatarSelector({
  token,
  onSelectionChange,
  showUpload = true,
}: AvatarSelectorProps): React.ReactElement {
  const [systemAvatars, setSystemAvatars] = useState<Avatar[]>([]);
  const [userAvatars, setUserAvatars] = useState<Avatar[]>([]);
  const [currentSelection, setCurrentSelection] = useState<AvatarSelection | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch system and user avatars in parallel (single network round-trip window).
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAvatars = async () => {
      try {
        setLoading(true);
        setError("");

        const authHeaders: HeadersInit | undefined = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const systemRequest = fetch(`${apiBase}/api/avatars/system`, { signal });
        const userRequest = token
          ? fetch(`${apiBase}/api/avatars/user`, { headers: authHeaders, signal })
          : Promise.resolve(null);
        const selectionRequest = token
          ? fetch(`${apiBase}/api/avatars/selection`, { headers: authHeaders, signal })
          : Promise.resolve(null);

        const [sysRes, userRes, selRes] = await Promise.all([
          systemRequest,
          userRequest,
          selectionRequest,
        ]);

        if (signal.aborted) return;

        if (sysRes && sysRes.ok) {
          const sysData = await sysRes.json();
          if (!signal.aborted) setSystemAvatars(sysData.data?.featured || []);
        }

        if (userRes && userRes.ok) {
          const userData = await userRes.json();
          if (!signal.aborted) setUserAvatars(userData.data?.avatars || []);
        }

        if (selRes && selRes.ok) {
          const selData = await selRes.json();
          if (!signal.aborted) setCurrentSelection(selData.data?.selection || null);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(`Failed to load avatars: ${(err as Error).message}`);

        console.error(err);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchAvatars();

    return () => {
      controller.abort();
    };
  }, [token, apiBase]);

  // Handle avatar selection
  const handleSelectAvatar = async (avatarId: string, type: "system" | "user") => {
    if (!token) {
      setError("Authentication required to select avatar");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/avatars/selection`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, id: avatarId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSelection(data.data?.selection || null);
        onSelectionChange?.(data.data?.selection);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to select avatar");
      }
    } catch (err) {
      setError(`Error selecting avatar: ${(err as Error).message}`);
       
      console.error(err);
    }
  };

  // Handle file upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("avatar", file);
      formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch(`${apiBase}/api/avatars/user/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUserAvatars([...userAvatars, data.data.avatar]);
      } else {
        const errData = await res.json();
        setError(errData.error || "Upload failed");
      }
    } catch (err) {
      setError(`Upload error: ${(err as Error).message}`);
       
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle delete avatar
  const handleDeleteAvatar = async (avatarId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/api/avatars/user/${avatarId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setUserAvatars(userAvatars.filter((a) => a.id !== avatarId));
      } else {
        setError("Failed to delete avatar");
      }
    } catch (err) {
      setError(`Delete error: ${(err as Error).message}`);
       
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading avatars...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Avatar Selector</h2>

      {error && (
        <div
          style={{
            padding: "10px",
            margin: "10px 0",
            backgroundColor: "#ffe0e0",
            color: "#d32f2f",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {/* System Avatars */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Featured System Avatars</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "10px",
          }}
        >
          {systemAvatars.map((avatar) => (
            <div
              key={avatar.id}
              style={{
                border:
                  currentSelection?.type === "system" && currentSelection?.id === avatar.id
                    ? "3px solid #1976d2"
                    : "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor:
                  currentSelection?.type === "system" && currentSelection?.id === avatar.id
                    ? "#e3f2fd"
                    : "#f5f5f5",
              }}
              onClick={() => handleSelectAvatar(avatar.id, "system")}
            >
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              />
              <p
                style={{
                  margin: "0 0 5px 0",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {avatar.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* User Avatars */}
      {token && (
        <div>
          <h3>Your Avatars</h3>
          {userAvatars.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {userAvatars.map((avatar) => (
                <div
                  key={avatar.id}
                  style={{
                    border:
                      currentSelection?.type === "user" && currentSelection?.id === avatar.id
                        ? "3px solid #1976d2"
                        : "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "10px",
                    textAlign: "center",
                    position: "relative",
                    backgroundColor:
                      currentSelection?.type === "user" && currentSelection?.id === avatar.id
                        ? "#e3f2fd"
                        : "#f5f5f5",
                  }}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.name}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "4px",
                      marginBottom: "8px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSelectAvatar(avatar.id, "user")}
                  />
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    {avatar.name}
                  </p>
                  <button
                    onClick={() => handleDeleteAvatar(avatar.id)}
                    style={{
                      padding: "4px 8px",
                      fontSize: "11px",
                      backgroundColor: "#ff5252",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#999" }}>No custom avatars uploaded yet.</p>
          )}

          {/* Upload Button */}
          {showUpload && (
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: uploading ? "#ccc" : "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: uploading ? "default" : "pointer",
                }}
              >
                {uploading ? "Uploading..." : "Upload Custom Avatar"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <p style={{ fontSize: "12px", color: "#999", marginTop: "10px" }}>
                Max size: 6 MB. Supported: PNG, JPEG, WebP
              </p>
            </div>
          )}
        </div>
      )}

      {!token && (
        <p style={{ color: "#999", marginTop: "20px" }}>
          Log in to upload custom avatars and manage your selection.
        </p>
      )}
    </div>
  );
}
