"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Msg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type MessageInsertPayload = {
  new: Msg;
};

export default function Chat({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: Msg[];
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [msgs, setMsgs] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: MessageInsertPayload) => {
          const m = payload.new;
          setMsgs((cur) => [...cur, m]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, threadId]);

  async function send() {
    if (!text.trim()) {
      return;
    }
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: u.user.id,
      content: text.trim(),
      kind: "text",
    });

    setBusy(false);
    if (!error) {
      setText("");
    }
  }

  return (
    <div className="card marketplace-card">
      <div className="marketplace-card-title">Thread Chat</div>
      <div className="marketplace-chat-window">
        {msgs.map((m) => (
          <div key={m.id} className="marketplace-chat-message">
            <div className="marketplace-muted">
              {m.sender_id} - {new Date(m.created_at).toLocaleString()}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
        {msgs.length === 0 && <div className="marketplace-muted">No messages yet.</div>}
      </div>
      <div className="marketplace-chat-inputs">
        <input
          className="marketplace-input"
          placeholder="Message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button onClick={send} disabled={busy} className="btn btn-primary" type="button">
          Send
        </button>
      </div>
    </div>
  );
}
