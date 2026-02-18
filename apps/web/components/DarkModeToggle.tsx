/**
 * Dark Mode Toggle Component
 * Allows users to switch between light and dark themes
 */

import React, { useState, useEffect } from "react";
import styles from "./DarkModeToggle.module.css";

type Theme = "light" | "dark" | "system";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light-theme", "dark-theme");

    if (newTheme === "system") {
      // Use system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark-theme" : "light-theme");
      root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      // Use explicit theme
      root.classList.add(`${newTheme}-theme`);
      root.setAttribute("data-theme", newTheme);
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);

    // Track analytics
    if (typeof window !== "undefined" && (window as any).trackEvent) {
      (window as any).trackEvent("theme_change", { theme: newTheme });
    }
  };

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // Prevent flash of incorrect theme
  if (!mounted) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        title={`Currently ${theme} mode`}
      >
        {theme === "dark" ? (
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            className={styles.icon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
        <span className={styles.label}>
          {theme === "dark" ? "Light" : "Dark"} Mode
        </span>
      </button>

      {/* Advanced settings dropdown (optional) */}
      <details className={styles.details}>
        <summary className={styles.summary}>Theme Settings</summary>
        <div className={styles.dropdown}>
          <button
            className={`${styles.option} ${theme === "light" ? styles.active : ""}`}
            onClick={() => handleThemeChange("light")}
          >
            <span>☀️ Light</span>
            {theme === "light" && <span className={styles.check}>✓</span>}
          </button>
          <button
            className={`${styles.option} ${theme === "dark" ? styles.active : ""}`}
            onClick={() => handleThemeChange("dark")}
          >
            <span>🌙 Dark</span>
            {theme === "dark" && <span className={styles.check}>✓</span>}
          </button>
          <button
            className={`${styles.option} ${theme === "system" ? styles.active : ""}`}
            onClick={() => handleThemeChange("system")}
          >
            <span>💻 System</span>
            {theme === "system" && <span className={styles.check}>✓</span>}
          </button>
        </div>
      </details>
    </div>
  );
}

/**
 * Inline script to prevent flash of unstyled content
 * Add to _document.tsx in <Head>
 */
export const DarkModeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            const theme = localStorage.getItem('theme') || 'system';
            const root = document.documentElement;
            
            if (theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              root.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
              root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
            } else {
              root.classList.add(theme + '-theme');
              root.setAttribute('data-theme', theme);
            }
          } catch (e) {}
        })();
      `,
    }}
  />
);
