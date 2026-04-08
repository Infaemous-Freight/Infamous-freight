/**
 * Phase 7 Tier 5: Language Switcher Component
 *
 * Dropdown UI for selecting language/locale
 * - Displays all 12 supported languages
 * - Shows native language names
 * - Persists selection to cookie and localStorage
 * - Syncs with backend via API call
 * - Triggers page reload to apply new locale
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "./LanguageSwitcher.module.css";

interface Locale {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isRTL: boolean;
}

const LOCALES: Locale[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", isRTL: false },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", isRTL: false },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", isRTL: false },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", isRTL: false },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", isRTL: false },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", isRTL: false },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", isRTL: false },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", isRTL: false },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", isRTL: true },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", isRTL: true },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", isRTL: false },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", isRTL: false },
];

interface LanguageSwitcherProps {
  variant?: "dropdown" | "modal";
  showFlag?: boolean;
  showNativeName?: boolean;
}

export default function LanguageSwitcher({
  variant: _variant = "dropdown",
  showFlag = true,
  showNativeName = true,
}: LanguageSwitcherProps): React.ReactElement {
  const router = useRouter();
  const t = (key: string): string => {
    const fallback: Record<string, string> = {
      changeLanguage: "Change language",
      selectLanguage: "Select language",
      close: "Close",
    };
    return fallback[key] ?? key;
  };
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<Locale | undefined>();

  useEffect(() => {
    const locale = LOCALES.find((l) => l.code === router.locale);
    setCurrentLocale(locale);
  }, [router.locale]);

  const changeLanguage = async (localeCode: string) => {
    try {
      // 1. Set cookie for persistence
      document.cookie = `NEXT_LOCALE=${localeCode}; path=/; max-age=31536000`; // 1 year

      // 2. Save to localStorage
      localStorage.setItem("preferredLocale", localeCode);

      // 3. Sync with backend API (if authenticated)
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/user/locale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ locale: localeCode }),
        }).catch((err) => console.error("Failed to sync locale with backend:", err));
      }

      // 4. Update Next.js i18n and reload page
      await router.push(router.pathname, router.asPath, { locale: localeCode });

      // 5. Update document direction for RTL
      const selectedLocale = LOCALES.find((l) => l.code === localeCode);
      if (selectedLocale?.isRTL) {
        document.documentElement.dir = "rtl";
        document.documentElement.lang = localeCode;
      } else {
        document.documentElement.dir = "ltr";
        document.documentElement.lang = localeCode;
      }

      setIsOpen(false);
    } catch (err) {
      console.error("Failed to change language:", err);
    }
  };

  if (!currentLocale) return <></>;

  return (
    <div className={styles.languageSwitcher}>
      {/* Current Language Button */}
      <button
        className={styles.currentButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("changeLanguage")}
        aria-expanded={isOpen}
      >
        {showFlag && <span className={styles.flag}>{currentLocale.flag}</span>}
        <span className={styles.label}>
          {showNativeName ? currentLocale.nativeName : currentLocale.name}
        </span>
        <span className={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <h3>{t("selectLanguage")}</h3>
              <button
                className={styles.closeButton}
                onClick={() => setIsOpen(false)}
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>
            <ul className={styles.localeList}>
              {LOCALES.map((locale) => (
                <li key={locale.code}>
                  <button
                    className={`${styles.localeButton} ${
                      locale.code === currentLocale.code ? styles.active : ""
                    }`}
                    onClick={() => changeLanguage(locale.code)}
                  >
                    {showFlag && <span className={styles.flag}>{locale.flag}</span>}
                    <span className={styles.localeName}>
                      <strong>{locale.nativeName}</strong>
                      {locale.nativeName !== locale.name && (
                        <span className={styles.englishName}>{locale.name}</span>
                      )}
                    </span>
                    {locale.code === currentLocale.code && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
