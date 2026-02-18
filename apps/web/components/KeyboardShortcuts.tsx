/**
 * Keyboard Shortcuts Reference Component
 * Displays all available keyboard shortcuts for the application
 */

import React, { useState, useEffect } from "react";
import styles from "./KeyboardShortcuts.module.css";

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: "⌘/Ctrl + K",
    description: "Focus search",
    category: "Navigation",
  },
  {
    keys: "⌘/Ctrl + /",
    description: "Open help center",
    category: "Navigation",
  },
  {
    keys: "g then h",
    description: "Go to home",
    category: "Navigation",
  },
  {
    keys: "g then d",
    description: "Go to dashboard",
    category: "Navigation",
  },
  {
    keys: "Escape",
    description: "Close modals/dropdowns",
    category: "General",
  },
  {
    keys: "Tab",
    description: "Navigate between elements",
    category: "Accessibility",
  },
  {
    keys: "Enter",
    description: "Activate focused element",
    category: "Accessibility",
  },
  {
    keys: "?",
    description: "Show keyboard shortcuts",
    category: "Help",
  },
];

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Show shortcuts on '?'
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't trigger if typing in input/textarea
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsOpen(true);
        }
      }

      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 id="shortcuts-title" className={styles.title}>
            Keyboard Shortcuts
          </h2>
          <button
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close keyboard shortcuts"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {categories.map((category) => (
            <div key={category} className={styles.category}>
              <h3 className={styles.categoryTitle}>{category}</h3>
              <div className={styles.shortcuts}>
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className={styles.shortcut}>
                      <kbd className={styles.keys}>{shortcut.keys}</kbd>
                      <span className={styles.description}>{shortcut.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <p>
            Press <kbd>?</kbd> to show this dialog, <kbd>Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
