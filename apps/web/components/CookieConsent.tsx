/**
 * GDPR Cookie Consent Banner - Phase 7 Tier 2
 *
 * Compliant with ePrivacy Directive and GDPR Article 7
 *
 * Features:
 * - Granular consent management
 * - Easy consent withdrawal
 * - Consent versioning
 * - Audit trail
 */

import React, { useState, useEffect } from "react";
import styles from "./CookieConsent.module.css";

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  ai_processing: boolean;
  location_tracking: boolean;
}

interface CookieConsentProps {
  onConsentUpdate?: (consents: ConsentPreferences) => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onConsentUpdate }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consents, setConsents] = useState<ConsentPreferences>({
    necessary: true, // Always true - required for service
    analytics: false,
    marketing: false,
    ai_processing: false,
    location_tracking: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem("gdpr-consent");
    if (!storedConsent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(storedConsent);
        setConsents(parsed.preferences);
      } catch (error) {
        console.error("Failed to parse stored consent:", error);
        setShowBanner(true);
      }
    }
  }, []);

  const saveConsents = async (preferences: ConsentPreferences) => {
    try {
      // Send consents to backend
      for (const [type, granted] of Object.entries(preferences)) {
        if (type === "necessary") continue; // Skip necessary (always true)

        await fetch("/api/gdpr/consent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            consentType: type,
            granted,
          }),
        });
      }

      // Store consent locally
      const consentData = {
        version: 1,
        timestamp: new Date().toISOString(),
        preferences,
      };
      localStorage.setItem("gdpr-consent", JSON.stringify(consentData));

      // Notify parent component
      if (onConsentUpdate) {
        onConsentUpdate(preferences);
      }

      setShowBanner(false);
    } catch (error) {
      console.error("Failed to save consents:", error);
      alert("Failed to save your preferences. Please try again.");
    }
  };

  const acceptAll = () => {
    const allConsents: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      ai_processing: true,
      location_tracking: true,
    };
    setConsents(allConsents);
    saveConsents(allConsents);
  };

  const rejectAll = () => {
    const minimalConsents: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      ai_processing: false,
      location_tracking: false,
    };
    setConsents(minimalConsents);
    saveConsents(minimalConsents);
  };

  const saveCustom = () => {
    saveConsents(consents);
  };

  const updateConsent = (key: keyof ConsentPreferences, value: boolean) => {
    setConsents((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={styles.cookieBanner}>
      <div className={styles.cookieContent}>
        <h3>🍪 Your Privacy Matters</h3>
        <p>
          We use cookies to provide essential services and improve your experience. You can
          customize your preferences below.
        </p>

        {showDetails && (
          <div className={styles.consentDetails}>
            <div className={styles.consentItem}>
              <label>
                <input type="checkbox" checked={consents.necessary} disabled />
                <strong>Necessary Cookies (Required)</strong>
              </label>
              <p className={styles.description}>
                Essential for the website to function. Cannot be disabled.
              </p>
            </div>

            <div className={styles.consentItem}>
              <label>
                <input
                  type="checkbox"
                  checked={consents.analytics}
                  onChange={(e) => updateConsent("analytics", e.target.checked)}
                />
                <strong>Analytics Cookies</strong>
              </label>
              <p className={styles.description}>
                Help us understand how you use our service to improve it.
              </p>
            </div>

            <div className={styles.consentItem}>
              <label>
                <input
                  type="checkbox"
                  checked={consents.marketing}
                  onChange={(e) => updateConsent("marketing", e.target.checked)}
                />
                <strong>Marketing Cookies</strong>
              </label>
              <p className={styles.description}>Used to show you relevant ads and promotions.</p>
            </div>

            <div className={styles.consentItem}>
              <label>
                <input
                  type="checkbox"
                  checked={consents.ai_processing}
                  onChange={(e) => updateConsent("ai_processing", e.target.checked)}
                />
                <strong>AI Processing</strong>
              </label>
              <p className={styles.description}>
                Allow AI features like predictive routing and automated assistance.
              </p>
            </div>

            <div className={styles.consentItem}>
              <label>
                <input
                  type="checkbox"
                  checked={consents.location_tracking}
                  onChange={(e) => updateConsent("location_tracking", e.target.checked)}
                />
                <strong>Location Tracking</strong>
              </label>
              <p className={styles.description}>
                Enable real-time tracking and location-based features.
              </p>
            </div>
          </div>
        )}

        <div className={styles.cookieActions}>
          <button className={styles.btnAcceptAll} onClick={acceptAll}>
            Accept All
          </button>

          <button className={styles.btnRejectAll} onClick={rejectAll}>
            Reject All
          </button>

          {showDetails ? (
            <button className={styles.btnCustom} onClick={saveCustom}>
              Save Preferences
            </button>
          ) : (
            <button className={styles.btnCustomize} onClick={() => setShowDetails(true)}>
              Customize
            </button>
          )}
        </div>

        <div className={styles.privacyLinks}>
          <a href="/privacy-policy" target="_blank">
            Privacy Policy
          </a>
          {" | "}
          <a href="/api/gdpr/export" target="_blank">
            Download My Data
          </a>
          {" | "}
          <a href="/gdpr-rights" target="_blank">
            Your GDPR Rights
          </a>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
