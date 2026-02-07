"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import {
  bootstrapCompany,
  createLoad,
  fireAiAction,
  getMe,
  listLoads,
  setActiveCompany,
} from "@/lib/api";

interface CompanyMembership {
  company_id: string;
  role: string;
}

export default function OnboardingPage() {
  return (
    <AuthGate>{({ user, token }) => <OnboardingContent userId={user.id} token={token} />}</AuthGate>
  );
}

function OnboardingContent({ userId, token }: { userId: string; token: string }) {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loadForm, setLoadForm] = useState({
    reference: "",
    pickup_location: "",
    dropoff_location: "",
  });
  const [loads, setLoads] = useState<any[]>([]);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const me = await getMe(token);
      setCompanies(me.companies as CompanyMembership[]);
      setActiveCompanyId(me.activeCompanyId);
      if (me.activeCompanyId) {
        const loadResp = await listLoads(token);
        setLoads(loadResp.loads ?? []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [token]);

  const handleBootstrap = async () => {
    setError(null);
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    try {
      const created = await bootstrapCompany(companyName.trim(), userId);
      await setActiveCompany(token, created.companyId);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreateLoad = async () => {
    setError(null);
    try {
      await createLoad(token, loadForm);
      setLoadForm({ reference: "", pickup_location: "", dropoff_location: "" });
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleAiAction = async () => {
    setError(null);
    try {
      const result = await fireAiAction(token, 1);
      setAiStatus(JSON.stringify(result.usage ?? result, null, 2));
    } catch (e: any) {
      setAiStatus(null);
      setError(e.message);
    }
  };

  return (
    <section className="container" style={{ padding: "32px 0" }}>
      <h1>Onboarding Wizard</h1>
      <p>Complete the steps below to activate your tenant and dispatch flow.</p>

      {loading ? <p>Loading onboarding data...</p> : null}
      {error ? (
        <div className="card" style={{ borderColor: "var(--danger-500)" }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div className="grid" style={{ gap: 24, marginTop: 24 }}>
        <div className="card">
          <h2>1. Create your company</h2>
          <p>Bootstrap your tenant and create your first company record.</p>
          <label className="input-label" htmlFor="company-name">
            Company name
          </label>
          <input
            id="company-name"
            className="input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Infamous Freight Co."
          />
          <button className="btn btn-primary" onClick={handleBootstrap}>
            Create company
          </button>
          {companies.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <strong>Companies:</strong>
              <ul>
                {companies.map((c) => (
                  <li key={c.company_id}>
                    {c.company_id} ({c.role})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h2>2. Set active company</h2>
          <p>Pick the tenant context that powers your dispatch board.</p>
          {companies.length === 0 ? (
            <p>Create a company first.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {companies.map((c) => (
                <button
                  key={c.company_id}
                  className={
                    activeCompanyId === c.company_id ? "btn btn-secondary" : "btn btn-tertiary"
                  }
                  onClick={() => setActiveCompany(token, c.company_id).then(refresh)}
                >
                  Use {c.company_id}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2>3. Create your first load</h2>
          <p>Seed the dispatch board with a load.</p>
          {activeCompanyId ? (
            <>
              <label className="input-label" htmlFor="load-reference">
                Reference
              </label>
              <input
                id="load-reference"
                className="input"
                value={loadForm.reference}
                onChange={(e) => setLoadForm((prev) => ({ ...prev, reference: e.target.value }))}
              />
              <label className="input-label" htmlFor="pickup-location">
                Pickup location
              </label>
              <input
                id="pickup-location"
                className="input"
                value={loadForm.pickup_location}
                onChange={(e) =>
                  setLoadForm((prev) => ({ ...prev, pickup_location: e.target.value }))
                }
              />
              <label className="input-label" htmlFor="dropoff-location">
                Dropoff location
              </label>
              <input
                id="dropoff-location"
                className="input"
                value={loadForm.dropoff_location}
                onChange={(e) =>
                  setLoadForm((prev) => ({ ...prev, dropoff_location: e.target.value }))
                }
              />
              <button className="btn btn-primary" onClick={handleCreateLoad}>
                Create load
              </button>
            </>
          ) : (
            <p>Select an active company first.</p>
          )}
          {loads.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <strong>Latest loads:</strong>
              <ul>
                {loads.slice(0, 3).map((l) => (
                  <li key={l.id}>
                    {l.reference || l.id} — {l.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h2>4. Trigger an AI action</h2>
          <p>Verify AI metering, alerts, and caps.</p>
          <button className="btn btn-secondary" onClick={handleAiAction}>
            Run AI action
          </button>
          {aiStatus ? (
            <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{aiStatus}</pre>
          ) : null}
        </div>
      </div>
    </section>
  );
}
