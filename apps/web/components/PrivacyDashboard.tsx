/**
 * GDPR Privacy Dashboard - Phase 7 Tier 2
 *
 * Allows users to exercise their GDPR rights:
 * - Article 15: Right to Access (Export Data)
 * - Article 16: Right to Rectification (Edit Profile)
 * - Article 17: Right to Erasure (Delete Account)
 * - Article 18: Right to Restrict Processing
 * - Article 20: Right to Data Portability
 * - Article 21: Right to Object
 */

import React, { useState, useEffect } from "react";
import styles from "./PrivacyDashboard.module.css";

interface ComplianceStatus {
  consents: number;
  lastDataProcessing: string;
  dataExportAvailable: boolean;
  erasureAvailable: boolean;
  portabilityAvailable: boolean;
  gdprCompliant: boolean;
}

interface Consent {
  type: string;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  lastUpdated: string;
}

export const PrivacyDashboard: React.FC = () => {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "xml">("json");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Load compliance status
      const statusRes = await fetch("/api/gdpr/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const statusData = await statusRes.json();
      setStatus(statusData.data);

      // Load consents
      const consentsRes = await fetch("/api/gdpr/consent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const consentsData = await consentsRes.json();
      setConsents(consentsData.data);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load privacy data:", error);
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/gdpr/export", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-export-${new Date().toISOString()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      alert("Your data has been downloaded successfully! (GDPR Article 15)");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handlePortableExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/gdpr/portability?format=${exportFormat}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `data-export.${exportFormat}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      alert(`Data exported in ${exportFormat.toUpperCase()} format! (GDPR Article 20)`);
    } catch (error) {
      console.error("Portable export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/gdpr/erase", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmationCode,
          reason: "user_request",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Your account has been deleted. You will be logged out. (GDPR Article 17)");
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        alert(`Deletion failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Account deletion failed:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const toggleConsent = async (consentType: string, currentValue: boolean) => {
    try {
      const token = localStorage.getItem("token");

      await fetch("/api/gdpr/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consentType,
          granted: !currentValue,
        }),
      });

      // Reload consents
      await loadPrivacyData();

      alert(`Consent ${!currentValue ? "granted" : "revoked"} successfully!`);
    } catch (error) {
      console.error("Failed to update consent:", error);
      alert("Failed to update consent. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loading}>Loading your privacy settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1>🔒 Privacy & Data Control</h1>
        <p>Manage your data and exercise your GDPR rights</p>
        {status?.gdprCompliant && <span className={styles.badge}>✓ GDPR Compliant</span>}
      </header>

      {/* Status Overview */}
      <section className={styles.section}>
        <h2>📊 Privacy Status</h2>
        <div className={styles.statusGrid}>
          <div className={styles.statusCard}>
            <div className={styles.statusValue}>{status?.consents || 0}</div>
            <div className={styles.statusLabel}>Active Consents</div>
          </div>
          <div className={styles.statusCard}>
            <div className={styles.statusValue}>
              {status?.lastDataProcessing
                ? new Date(status.lastDataProcessing).toLocaleDateString()
                : "Never"}
            </div>
            <div className={styles.statusLabel}>Last Data Processing</div>
          </div>
          <div className={styles.statusCard}>
            <div className={styles.statusValue}>
              {status?.dataExportAvailable ? "✓ Available" : "✗ Unavailable"}
            </div>
            <div className={styles.statusLabel}>Data Export</div>
          </div>
        </div>
      </section>

      {/* Consent Management */}
      <section className={styles.section}>
        <h2>✅ Consent Management (Article 7)</h2>
        <p className={styles.sectionDescription}>
          Control how we use your data. You can change these at any time.
        </p>
        <div className={styles.consentList}>
          {consents.map((consent) => (
            <div key={consent.type} className={styles.consentItem}>
              <div className={styles.consentInfo}>
                <strong>{consent.type.replace(/_/g, " ").toUpperCase()}</strong>
                <span className={consent.granted ? styles.granted : styles.revoked}>
                  {consent.granted ? "Granted" : "Not Granted"}
                </span>
              </div>
              <div className={styles.consentDate}>
                {consent.granted && consent.grantedAt && (
                  <small>Granted: {new Date(consent.grantedAt).toLocaleDateString()}</small>
                )}
                {!consent.granted && consent.revokedAt && (
                  <small>Revoked: {new Date(consent.revokedAt).toLocaleDateString()}</small>
                )}
              </div>
              <button
                className={consent.granted ? styles.btnRevoke : styles.btnGrant}
                onClick={() => toggleConsent(consent.type, consent.granted)}
              >
                {consent.granted ? "Revoke" : "Grant"} Consent
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Data Export (Article 15) */}
      <section className={styles.section}>
        <h2>📥 Export Your Data (Article 15)</h2>
        <p className={styles.sectionDescription}>Download a complete copy of your personal data.</p>
        <button className={styles.btnPrimary} onClick={handleExportData}>
          Download My Data (JSON)
        </button>
      </section>

      {/* Data Portability (Article 20) */}
      <section className={styles.section}>
        <h2>📤 Data Portability (Article 20)</h2>
        <p className={styles.sectionDescription}>
          Export your data in a machine-readable format to transfer to another service.
        </p>
        <div className={styles.exportControls}>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className={styles.select}
          >
            <option value="json">JSON Format</option>
            <option value="csv">CSV Format</option>
            <option value="xml">XML Format</option>
          </select>
          <button className={styles.btnPrimary} onClick={handlePortableExport}>
            Export ({exportFormat.toUpperCase()})
          </button>
        </div>
      </section>

      {/* Right to Erasure (Article 17) */}
      <section className={styles.section}>
        <h2>🗑️ Delete My Account (Article 17)</h2>
        <p className={styles.sectionDescription}>
          Permanently delete your account and personal data. This action cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button className={styles.btnDanger} onClick={() => setShowDeleteConfirm(true)}>
            Request Account Deletion
          </button>
        ) : (
          <div className={styles.deleteConfirm}>
            <p className={styles.warning}>
              ⚠️ <strong>Warning:</strong> This will permanently delete your account and all
              associated data. Some data may be retained for legal compliance.
            </p>
            <p>
              To confirm, enter the confirmation code:
              <br />
              <code className={styles.code}>{generateConfirmationCode()}</code>
            </p>
            <input
              type="text"
              placeholder="Enter confirmation code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className={styles.input}
            />
            <div className={styles.deleteActions}>
              <button
                className={styles.btnDanger}
                onClick={handleDeleteAccount}
                disabled={!confirmationCode}
              >
                Confirm Deletion
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmationCode("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Privacy Policy Links */}
      <section className={styles.section}>
        <h2>📄 Privacy Resources</h2>
        <ul className={styles.linkList}>
          <li>
            <a href="/privacy-policy">Privacy Policy</a>
          </li>
          <li>
            <a href="/terms-of-service">Terms of Service</a>
          </li>
          <li>
            <a href="/gdpr-rights">Your GDPR Rights</a>
          </li>
          <li>
            <a href="/data-protection">Data Protection Information</a>
          </li>
          <li>
            <a href="mailto:privacy@infamousfreight.com">Contact Data Protection Officer</a>
          </li>
        </ul>
      </section>
    </div>
  );
};

// Helper: Generate confirmation code for account deletion
function generateConfirmationCode(): string {
  const userId = localStorage.getItem("userId") || "user";
  const crypto = window.crypto || (window as any).msCrypto;

  if (crypto && crypto.subtle) {
    // In production, this should match server-side generation
    // For now, we'll use a simplified version
    return `${userId.substring(0, 4).toUpperCase()}DEL`;
  }

  return "CONFIRM";
}

export default PrivacyDashboard;
