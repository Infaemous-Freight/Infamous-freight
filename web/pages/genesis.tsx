"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { getLocaleFromRouter, t } from "../lib/i18n/t";

type GenesisProfile = {
  name: string;
  voice: "calm" | "direct" | "coach" | "red" | string;
  tone: "red" | "neutral" | string;
  capabilities: string[];
  avatar: {
    type: "system" | "user";
    id: string;
    imageUrl: string;
    label: string;
  };
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  ts?: number;
};

type ChatResponseMeta = {
  provider?: string;
  model?: string;
};

const palette = {
  bg: "radial-gradient(circle at 20% 20%, #2a0c0c 0%, #120505 55%, #0a0202 100%)",
  panel: "#1c0b0b",
  border: "rgba(255,64,64,0.35)",
  borderStrong: "rgba(255,64,64,0.9)",
  text: "#f9f5f5",
  muted: "rgba(255,255,255,0.65)",
  accent: "#ff4545",
  accentSoft: "rgba(255,69,69,0.08)",
};

function resolveImage(apiBase: string, url?: string) {
  if (!url) return "/avatars/main/main-01.png";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads")) return `${apiBase}${url}`;
  return url;
}

export default function GenesisPage() {
  const router = useRouter();
  const locale = getLocaleFromRouter(router.locale);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<GenesisProfile | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(
    "Add a JWT with user:avatar scope to chat as yourself.",
  );
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [sending, setSending] = useState(false);
  const [userIdInput, setUserIdInput] = useState("demo-user");
  const [signingIn, setSigningIn] = useState(false);
  const [providerInfo, setProviderInfo] = useState<ChatResponseMeta | null>(
    null,
  );

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem("genesisToken") ||
          window.localStorage.getItem("avatarToken")
        : null;
    if (saved) {
      setToken(saved);
      setStatus("Loaded cached token. Fetching profile...");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    window.localStorage.setItem("genesisToken", token);
  }, [token]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token],
  );

  async function signInDev() {
    const desiredId = userIdInput.trim() || "demo-user";
    setSigningIn(true);
    setError("");
    setStatus("Requesting dev token...");
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
      setStatus(`Signed in as ${desiredId}`);
    } catch (err) {
      setError((err as Error).message || "Sign-in failed");
      setStatus("Sign-in failed.");
    } finally {
      setSigningIn(false);
    }
  }

  async function loadProfile() {
    if (!token) {
      setProfile(null);
      setStatus("Add a JWT with user:avatar scope to load Genesis profile.");
      return;
    }

    setLoadingProfile(true);
    setError("");
    setStatus("Fetching Genesis profile...");

    try {
      const res = await fetch(`${apiBase}/v1/genesis/profile`, {
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || json.message || "Failed to load profile");
      }
      setProfile(json.profile || json.data?.profile || null);
      setStatus("Profile ready. Say hi to Genesis.");
    } catch (err) {
      setError((err as Error).message || "Profile request failed");
      setStatus("Profile unavailable. Check your token or API base URL.");
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    loadProfile().catch((err) => setError((err as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function sendMessage() {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!authHeaders) {
      setError("Add a JWT token before chatting.");
      return;
    }

    setSending(true);
    setError("");
    setStatus("Sending to Genesis...");

    try {
      const res = await fetch(`${apiBase}/v1/genesis/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ message: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json.error || json.message || "Chat failed");
      }

      setHistory(json.history || []);
      setProviderInfo({ provider: json.provider, model: json.model });
      setMessage("");
      setStatus("Genesis replied.");
      if (!profile) {
        loadProfile().catch(() => {});
      }
    } catch (err) {
      setError((err as Error).message || "Chat failed");
      setStatus("Genesis is waiting for a valid request.");
    } finally {
      setSending(false);
    }
  }

  const avatarUrl = resolveImage(apiBase, profile?.avatar?.imageUrl);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 18px 48px",
        background: palette.bg,
        color: palette.text,
        fontFamily: "'Space Grotesk', 'Sora', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 }}
      >
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 18,
            borderRadius: 16,
            border: `1px solid ${palette.border}`,
            background: palette.panel,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: `2px solid ${palette.borderStrong}`,
                background: palette.accentSoft,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                letterSpacing: 0.6,
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {t(locale, "genesis.title")}
              </div>
              <div style={{ color: palette.muted, fontSize: 14 }}>
                {t(locale, "genesis.subtitle")}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: palette.muted, fontSize: 13 }}>
                JWT token (must include user:avatar scope)
              </span>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token"
                style={{
                  padding: "11px 12px",
                  borderRadius: 12,
                  border: `1px solid ${palette.border}`,
                  background: palette.panel,
                  color: palette.text,
                  fontFamily: "inherit",
                  outline: "none",
                  boxShadow: "0 0 0 1px rgba(255,69,69,0.08)",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="user id (dev)"
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${palette.border}`,
                  background: palette.panel,
                  color: palette.text,
                  minWidth: 220,
                }}
              />
              <button
                onClick={signInDev}
                disabled={signingIn}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: `1px solid ${palette.borderStrong}`,
                  background: signingIn ? palette.panel : palette.accentSoft,
                  color: palette.text,
                  cursor: signingIn ? "not-allowed" : "pointer",
                  opacity: signingIn ? 0.6 : 1,
                }}
              >
                {signingIn ? "Signing in..." : "Get dev token"}
              </button>
              <span style={{ color: palette.muted, fontSize: 12 }}>
                Calls /v1/auth/dev-token (dev-only) and stores token in
                localStorage.
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={loadProfile}
                disabled={loadingProfile || !token}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: `1px solid ${palette.borderStrong}`,
                  background: loadingProfile
                    ? palette.panel
                    : palette.accentSoft,
                  color: palette.text,
                  cursor: loadingProfile || !token ? "not-allowed" : "pointer",
                  opacity: loadingProfile || !token ? 0.6 : 1,
                }}
              >
                {loadingProfile ? "Loading..." : "Load Profile"}
              </button>
              <span style={{ color: palette.muted, fontSize: 13 }}>
                {status}
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div
            style={{
              border: `1px solid ${palette.borderStrong}`,
              background: palette.accentSoft,
              borderRadius: 14,
              padding: 12,
              color: palette.text,
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "minmax(260px, 1fr) 2fr",
            alignItems: "start",
          }}
        >
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${palette.border}`,
              background: palette.panel,
              padding: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={avatarUrl}
                alt={profile?.avatar?.label || "Genesis avatar"}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${palette.borderStrong}`,
                  background: palette.accentSoft,
                }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {profile?.name || "Genesis"}
                </div>
                <div style={{ color: palette.muted, fontSize: 13 }}>
                  {profile?.avatar?.label || "System Avatar"}
                </div>
                {providerInfo?.provider ? (
                  <div style={{ color: palette.muted, fontSize: 12 }}>
                    Provider: {providerInfo.provider}
                    {providerInfo.model ? ` • ${providerInfo.model}` : ""}
                  </div>
                ) : null}
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ color: palette.muted, fontSize: 13 }}>
                Capabilities
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(
                  profile?.capabilities || [
                    "Avatar-aware",
                    "Deterministic responses",
                    "In-memory history",
                  ]
                ).map((cap) => (
                  <span
                    key={cap}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: `1px solid ${palette.border}`,
                      background: palette.accentSoft,
                      color: palette.text,
                      fontSize: 12,
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${palette.border}`,
              background: palette.panel,
              padding: 16,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              Chat with Genesis
            </div>
            <div
              style={{
                borderRadius: 12,
                border: `1px solid ${palette.border}`,
                background: "rgba(255,69,69,0.03)",
                minHeight: 240,
                maxHeight: 420,
                overflowY: "auto",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {history.length === 0 && (
                <div style={{ color: palette.muted, fontSize: 14 }}>
                  No messages yet. Ask about deployment, avatars, or freight
                  ops.
                </div>
              )}
              {history.map((msg, idx) => (
                <div
                  key={`${msg.ts || idx}-${idx}`}
                  style={{
                    alignSelf:
                      msg.role === "assistant" ? "flex-start" : "flex-end",
                    maxWidth: "88%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background:
                      msg.role === "assistant"
                        ? "rgba(255,69,69,0.08)"
                        : "rgba(255,255,255,0.04)",
                    color: palette.text,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.muted,
                      marginBottom: 4,
                    }}
                  >
                    {msg.role === "assistant" ? "Genesis" : "You"}
                  </div>
                  {msg.content}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={3}
                placeholder={t(locale, "genesis.placeholder")}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: `1px solid ${palette.border}`,
                  background: "rgba(255,255,255,0.03)",
                  color: palette.text,
                  padding: "10px 12px",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={sendMessage}
                  disabled={sending || !message.trim()}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    border: `1px solid ${palette.borderStrong}`,
                    background: sending ? palette.panel : palette.accentSoft,
                    color: palette.text,
                    cursor:
                      sending || !message.trim() ? "not-allowed" : "pointer",
                    opacity: sending || !message.trim() ? 0.6 : 1,
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
                <span style={{ color: palette.muted, fontSize: 12 }}>
                  Deterministic, in-memory replies. No external AI keys
                  required.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
