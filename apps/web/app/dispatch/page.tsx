"use client";

import { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import {
  createDocumentUpload,
  createLoad,
  createMessage,
  createStatusEvent,
  createThread,
  listDocuments,
  listLoads,
  listMessages,
  listStatusEvents,
  listThreads,
} from "@/lib/api";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function DispatchPage() {
  return <AuthGate>{({ token }) => <DispatchContent token={token} />}</AuthGate>;
}

function DispatchContent({ token }: { token: string }) {
  const supabase = useMemo(() => supabaseBrowser, []);
  const [loads, setLoads] = useState<any[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [statusEvents, setStatusEvents] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [statusForm, setStatusForm] = useState({ status: "", note: "" });
  const [loadForm, setLoadForm] = useState({
    reference: "",
    pickup_location: "",
    dropoff_location: "",
  });
  const [uploadState, setUploadState] = useState({ docType: "pod", file: null as File | null });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshLoads = async () => {
    const data = await listLoads(token);
    setLoads(data.loads ?? []);
    if (!selectedLoadId && data.loads?.length) {
      setSelectedLoadId(data.loads[0].id);
    }
  };

  const refreshLoadDetails = async (loadId: string) => {
    const threads = await listThreads(token, loadId);
    let activeThread = threads.threads?.[0];
    if (!activeThread) {
      const created = await createThread(token, loadId);
      activeThread = created.thread;
    }
    setThreadId(activeThread?.id ?? null);

    const [msgs, statuses, docs] = await Promise.all([
      listMessages(token, activeThread.id),
      listStatusEvents(token, loadId),
      listDocuments(token, loadId),
    ]);
    setMessages(msgs.messages ?? []);
    setStatusEvents(statuses.events ?? []);
    setDocuments(docs.documents ?? []);
  };

  useEffect(() => {
    refreshLoads().catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    if (selectedLoadId) {
      refreshLoadDetails(selectedLoadId).catch((e) => setError(e.message));
    }
  }, [selectedLoadId, token]);

  const handleCreateLoad = async () => {
    setError(null);
    setLoading(true);
    try {
      await createLoad(token, loadForm);
      setLoadForm({ reference: "", pickup_location: "", dropoff_location: "" });
      await refreshLoads();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!threadId || !newMessage.trim()) return;
    setError(null);
    try {
      await createMessage(token, threadId, newMessage.trim());
      setNewMessage("");
      await refreshLoadDetails(selectedLoadId!);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedLoadId || !statusForm.status.trim()) return;
    setError(null);
    try {
      await createStatusEvent(
        token,
        selectedLoadId,
        statusForm.status.trim(),
        statusForm.note.trim() || undefined,
      );
      setStatusForm({ status: "", note: "" });
      await refreshLoadDetails(selectedLoadId);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedLoadId || !uploadState.file) return;
    setError(null);
    setLoading(true);
    try {
      const { upload } = await createDocumentUpload(token, {
        loadId: selectedLoadId,
        docType: uploadState.docType,
        fileName: uploadState.file.name,
      });

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(upload.path, upload.token, uploadState.file, {
          contentType: uploadState.file.type || "application/octet-stream",
        });

      if (uploadError) throw new Error(uploadError.message);

      setUploadState({ docType: "pod", file: null });
      await refreshLoadDetails(selectedLoadId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container" style={{ padding: "32px 0" }}>
      <h1>Dispatch Board</h1>
      <p>Monitor loads, coordinate messages, update statuses, and manage documents.</p>

      {error ? (
        <div className="card" style={{ borderColor: "var(--danger-500)" }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div className="grid" style={{ gap: 24, gridTemplateColumns: "280px 1fr" }}>
        <aside className="card" style={{ height: "fit-content" }}>
          <h2>Loads</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loads.map((load) => (
              <button
                key={load.id}
                className={selectedLoadId === load.id ? "btn btn-secondary" : "btn btn-tertiary"}
                onClick={() => setSelectedLoadId(load.id)}
              >
                {load.reference || load.id}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <h3>Create load</h3>
            <input
              className="input"
              placeholder="Reference"
              value={loadForm.reference}
              onChange={(e) => setLoadForm((prev) => ({ ...prev, reference: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Pickup"
              value={loadForm.pickup_location}
              onChange={(e) =>
                setLoadForm((prev) => ({ ...prev, pickup_location: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Dropoff"
              value={loadForm.dropoff_location}
              onChange={(e) =>
                setLoadForm((prev) => ({ ...prev, dropoff_location: e.target.value }))
              }
            />
            <button className="btn btn-primary" onClick={handleCreateLoad} disabled={loading}>
              {loading ? "Working..." : "Add load"}
            </button>
          </div>
        </aside>

        <div className="grid" style={{ gap: 24 }}>
          <div className="card">
            <h2>Status Updates</h2>
            {selectedLoadId ? (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    className="input"
                    placeholder="Status"
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Note"
                    value={statusForm.note}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                  <button className="btn btn-secondary" onClick={handleStatusUpdate}>
                    Add status
                  </button>
                </div>
                <ul style={{ marginTop: 12 }}>
                  {statusEvents.map((event) => (
                    <li key={event.id}>
                      <strong>{event.status}</strong> — {event.note || "No note"}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Select a load to view status events.</p>
            )}
          </div>

          <div className="card">
            <h2>Messages</h2>
            {threadId ? (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <input
                    className="input"
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={handleSendMessage}>
                    Send
                  </button>
                </div>
                <ul>
                  {messages.map((message) => (
                    <li key={message.id}>
                      {message.body}
                      <small style={{ marginLeft: 8, opacity: 0.7 }}>
                        {new Date(message.created_at).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Select a load to start a thread.</p>
            )}
          </div>

          <div className="card">
            <h2>Documents</h2>
            {selectedLoadId ? (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    className="input"
                    value={uploadState.docType}
                    onChange={(e) =>
                      setUploadState((prev) => ({ ...prev, docType: e.target.value }))
                    }
                  >
                    <option value="pod">POD</option>
                    <option value="rate-confirmation">Rate Confirmation</option>
                    <option value="bol">BOL</option>
                  </select>
                  <input
                    type="file"
                    onChange={(e) =>
                      setUploadState((prev) => ({
                        ...prev,
                        file: e.target.files?.[0] ?? null,
                      }))
                    }
                  />
                  <button className="btn btn-secondary" onClick={handleUpload} disabled={loading}>
                    Upload
                  </button>
                </div>
                <ul style={{ marginTop: 12 }}>
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      {doc.doc_type} — {doc.storage_path}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Select a load to manage documents.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
