/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Sign-Off Workflow Dashboard
 */

import { useState, useEffect } from "react";
import Head from "next/head";

interface Signature {
  id: string;
  stakeholder_role: string;
  user: {
    name: string;
    email: string;
  };
  signed_at: string;
  comments?: string;
  conditions?: string;
}

interface SignOffRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  status: "pending" | "completed" | "rejected" | "cancelled";
  required_stakeholders: string[];
  created_at: string;
  deadline?: string;
  signatures: Signature[];
  progress: {
    signed: number;
    required: number;
    percentage: number;
  };
  missing_signatures: string[];
}

const STAKEHOLDER_DISPLAY = {
  ENGINEERING_LEAD: "👨‍💻 Engineering Lead",
  OPERATIONS_MANAGER: "⚙️ Operations Manager",
  PRODUCT_OWNER: "📊 Product Owner",
  SECURITY_OFFICER: "🔒 Security Officer",
  QA_LEAD: "🧪 QA Lead",
  CTO: "🎯 CTO",
};

export default function SignOffDashboard() {
  const [signoffs, setSignoffs] = useState<SignOffRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedSignoff, setSelectedSignoff] = useState<SignOffRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSignOffs();
  }, [filter]);

  const fetchSignOffs = async () => {
    try {
      setLoading(true);
      const query = filter !== "all" ? `?status=${filter}` : "";
      const res = await fetch(`/api/signoffs${query}`);
      const data = await res.json();
      setSignoffs(data.data || []);
    } catch (err) {
      console.error("Failed to fetch sign-offs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (signoffId: string, role: string) => {
    const comments = prompt(
      `Comments for ${STAKEHOLDER_DISPLAY[role as keyof typeof STAKEHOLDER_DISPLAY]}:`,
    );
    if (comments === null) return; // User cancelled

    try {
      const res = await fetch(`/api/signoffs/${signoffId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeholder_role: role,
          comments,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSignOffs();
        if (selectedSignoff?.id === signoffId) {
          fetchSignOffDetails(signoffId);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to sign off");

      console.error(err);
    }
  };

  const handleReject = async (signoffId: string, role: string) => {
    const reason = prompt(
      `Reason for rejecting (${STAKEHOLDER_DISPLAY[role as keyof typeof STAKEHOLDER_DISPLAY]}):`,
    );
    if (!reason || reason.trim().length < 10) {
      alert("Rejection reason must be at least 10 characters");
      return;
    }

    try {
      const res = await fetch(`/api/signoffs/${signoffId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stakeholder_role: role,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Sign-off rejected");
        fetchSignOffs();
        setSelectedSignoff(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to reject sign-off");

      console.error(err);
    }
  };

  const fetchSignOffDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/signoffs/${id}`);
      const data = await res.json();
      setSelectedSignoff(data.data);
    } catch (err) {
      console.error("Failed to fetch sign-off details:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <>
      <Head>
        <title>Sign-Off Workflow | Infamous Freight</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📝 Sign-Off Workflow</h1>
              <p className="text-gray-600 mt-2">Manage stakeholder approvals and sign-offs</p>
            </div>
            <button
              onClick={() => (window.location.href = "/admin/signoffs/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + New Sign-Off Request
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex space-x-4">
              {["all", "pending", "completed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as "all" | "pending" | "completed")}
                  className={`px-4 py-2 rounded ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sign-Offs List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sign-Off Requests</h2>

              {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading...</p>
                </div>
              ) : signoffs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">No sign-off requests found</p>
                </div>
              ) : (
                signoffs.map((signoff) => (
                  <div
                    key={signoff.id}
                    onClick={() => fetchSignOffDetails(signoff.id)}
                    className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${
                      selectedSignoff?.id === signoff.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{signoff.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{signoff.type}</p>
                      </div>
                      {getStatusBadge(signoff.status)}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>
                          {signoff.progress.signed}/{signoff.progress.required} signed
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${signoff.progress.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Deadline */}
                    {signoff.deadline && (
                      <div
                        className={`text-xs ${isOverdue(signoff.deadline) ? "text-red-600" : "text-gray-600"}`}
                      >
                        Deadline: {new Date(signoff.deadline).toLocaleDateString()}
                        {isOverdue(signoff.deadline) && " ⚠️ OVERDUE"}
                      </div>
                    )}

                    {/* Missing signatures */}
                    {signoff.missing_signatures.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {signoff.missing_signatures.map((role) => (
                          <span
                            key={role}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {STAKEHOLDER_DISPLAY[role as keyof typeof STAKEHOLDER_DISPLAY] || role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Details Panel */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Details</h2>

              {!selectedSignoff ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">Select a sign-off request to view details</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedSignoff.title}</h3>
                    <p className="text-gray-600 mt-2">{selectedSignoff.description}</p>
                    <div className="mt-3">{getStatusBadge(selectedSignoff.status)}</div>
                  </div>

                  {/* Signatures */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Required Signatures</h4>
                    <div className="space-y-3">
                      {selectedSignoff.required_stakeholders.map((role) => {
                        const signature = selectedSignoff.signatures.find(
                          (s) => s.stakeholder_role === role,
                        );

                        return (
                          <div
                            key={role}
                            className={`p-4 rounded-lg border ${
                              signature
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {STAKEHOLDER_DISPLAY[role as keyof typeof STAKEHOLDER_DISPLAY] ||
                                    role}
                                </div>
                                {signature ? (
                                  <div className="text-sm text-gray-600 mt-1">
                                    <div>✅ Signed by {signature.user.name}</div>
                                    <div>{new Date(signature.signed_at).toLocaleString()}</div>
                                    {signature.comments && (
                                      <div className="mt-2 text-xs italic">
                                        "{signature.comments}"
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 mt-1">
                                    ⏳ Awaiting signature
                                  </div>
                                )}
                              </div>

                              {!signature && selectedSignoff.status === "pending" && (
                                <div className="space-x-2">
                                  <button
                                    onClick={() => handleSign(selectedSignoff.id, role)}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                  >
                                    Sign
                                  </button>
                                  <button
                                    onClick={() => handleReject(selectedSignoff.id, role)}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t pt-4">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Created: {new Date(selectedSignoff.created_at).toLocaleString()}</div>
                      {selectedSignoff.deadline && (
                        <div className={isOverdue(selectedSignoff.deadline) ? "text-red-600" : ""}>
                          Deadline: {new Date(selectedSignoff.deadline).toLocaleString()}
                          {isOverdue(selectedSignoff.deadline) && " ⚠️ OVERDUE"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
