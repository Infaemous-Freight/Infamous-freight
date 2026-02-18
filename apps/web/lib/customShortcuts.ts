/**
 * Customizable Keyboard Shortcuts System
 * Allows users to personalize keyboard shortcuts
 */

import { useState, useEffect, useCallback } from "react";

export interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  defaultKeys: string;
  keys: string;
  category: string;
  action: () => void;
  enabled: boolean;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  description: string;
}

// Default shortcut categories
export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  { id: "navigation", name: "Navigation", description: "Move around the app" },
  { id: "general", name: "General", description: "Common actions" },
  { id: "editing", name: "Editing", description: "Edit and modify content" },
  { id: "help", name: "Help", description: "Get assistance" },
];

// Default shortcuts
const DEFAULT_SHORTCUTS: Omit<ShortcutConfig, "action">[] = [
  {
    id: "search",
    name: "Open Search",
    description: "Focus the search bar",
    defaultKeys: "cmd+k",
    keys: "cmd+k",
    category: "general",
    enabled: true,
  },
  {
    id: "help",
    name: "Open Help",
    description: "Display help center",
    defaultKeys: "cmd+/",
    keys: "cmd+/",
    category: "help",
    enabled: true,
  },
  {
    id: "goto-home",
    name: "Go to Home",
    description: "Navigate to home page",
    defaultKeys: "g,h",
    keys: "g,h",
    category: "navigation",
    enabled: true,
  },
  {
    id: "goto-dashboard",
    name: "Go to Dashboard",
    description: "Navigate to dashboard",
    defaultKeys: "g,d",
    keys: "g,d",
    category: "navigation",
    enabled: true,
  },
  {
    id: "goto-shipments",
    name: "Go to Shipments",
    description: "Navigate to shipments",
    defaultKeys: "g,s",
    keys: "g,s",
    category: "navigation",
    enabled: true,
  },
  {
    id: "close-modal",
    name: "Close Modal",
    description: "Close open dialogs",
    defaultKeys: "escape",
    keys: "escape",
    category: "general",
    enabled: true,
  },
  {
    id: "show-shortcuts",
    name: "Show Shortcuts",
    description: "Display keyboard shortcuts",
    defaultKeys: "?",
    keys: "?",
    category: "help",
    enabled: true,
  },
  {
    id: "refresh",
    name: "Refresh Page",
    description: "Reload current page data",
    defaultKeys: "cmd+r",
    keys: "cmd+r",
    category: "general",
    enabled: true,
  },
  {
    id: "save",
    name: "Save",
    description: "Save current changes",
    defaultKeys: "cmd+s",
    keys: "cmd+s",
    category: "editing",
    enabled: true,
  },
  {
    id: "undo",
    name: "Undo",
    description: "Undo last action",
    defaultKeys: "cmd+z",
    keys: "cmd+z",
    category: "editing",
    enabled: true,
  },
];

const STORAGE_KEY = "infamous-shortcuts";

/**
 * Hook to manage customizable shortcuts
 */
export function useCustomShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved shortcuts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setShortcuts(parsed);
      } else {
        // Initialize with defaults
        setShortcuts(DEFAULT_SHORTCUTS as ShortcutConfig[]);
      }
    } catch (error) {
      console.error("Failed to load shortcuts:", error);
      setShortcuts(DEFAULT_SHORTCUTS as ShortcutConfig[]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save shortcuts to localStorage
  const saveShortcuts = useCallback((newShortcuts: ShortcutConfig[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newShortcuts));
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error("Failed to save shortcuts:", error);
    }
  }, []);

  // Update a single shortcut
  const updateShortcut = useCallback(
    (id: string, updates: Partial<ShortcutConfig>) => {
      const updated = shortcuts.map((shortcut) =>
        shortcut.id === id ? { ...shortcut, ...updates } : shortcut
      );
      saveShortcuts(updated);
    },
    [shortcuts, saveShortcuts]
  );

  // Reset a shortcut to default
  const resetShortcut = useCallback(
    (id: string) => {
      const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.id === id);
      if (defaultShortcut) {
        updateShortcut(id, { keys: defaultShortcut.defaultKeys });
      }
    },
    [updateShortcut]
  );

  // Reset all shortcuts to defaults
  const resetAllShortcuts = useCallback(() => {
    saveShortcuts(DEFAULT_SHORTCUTS as ShortcutConfig[]);
  }, [saveShortcuts]);

  // Export shortcuts configuration
  const exportShortcuts = useCallback(() => {
    const data = JSON.stringify(shortcuts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "infamous-shortcuts.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [shortcuts]);

  // Import shortcuts configuration
  const importShortcuts = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          saveShortcuts(imported);
        } catch (error) {
          console.error("Failed to import shortcuts:", error);
          alert("Invalid shortcuts file");
        }
      };
      reader.readAsText(file);
    },
    [saveShortcuts]
  );

  return {
    shortcuts,
    isLoading,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    exportShortcuts,
    importShortcuts,
  };
}

/**
 * Parse keyboard shortcut string
 */
export function parseShortcut(keys: string): {
  cmd: boolean;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  key: string;
  sequence: string[];
} {
  const parts = keys.toLowerCase().split("+");
  const sequence = keys.includes(",") ? keys.split(",") : [];

  return {
    cmd: parts.includes("cmd") || parts.includes("meta"),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    alt: parts.includes("alt") || parts.includes("option"),
    shift: parts.includes("shift"),
    key: parts[parts.length - 1],
    sequence,
  };
}

/**
 * Check if keyboard event matches shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: string
): boolean {
  const parsed = parseShortcut(shortcut);

  // Handle sequences (vim-style)
  if (parsed.sequence.length > 0) {
    // Sequence matching requires state management
    return false;
  }

  // Check modifiers
  const cmdMatch = parsed.cmd ? event.metaKey || event.ctrlKey : !event.metaKey && !event.ctrlKey;
  const altMatch = parsed.alt ? event.altKey : !event.altKey;
  const shiftMatch = parsed.shift ? event.shiftKey : !event.shiftKey;

  // Check key
  const keyMatch =
    event.key.toLowerCase() === parsed.key ||
    event.code.toLowerCase() === parsed.key;

  return cmdMatch && altMatch && shiftMatch && keyMatch;
}

/**
 * Format shortcut for display
 */
export function formatShortcut(keys: string): string {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");

  return keys
    .split("+")
    .map((key) => {
      switch (key.toLowerCase()) {
case "cmd":
        case "meta":
          return isMac ? "⌘" : "Ctrl";
        case "ctrl":
        case "control":
          return isMac ? "⌃" : "Ctrl";
        case "alt":
        case "option":
          return isMac ? "⌥" : "Alt";
        case "shift":
          return isMac ? "⇧" : "Shift";
        case "escape":
          return "Esc";
        case "backspace":
          return "⌫";
        case "delete":
          return "⌦";
        case "enter":
          return "↵";
        case "tab":
          return "⇥";
        case "space":
          return "Space";
        default:
          return key.toUpperCase();
      }
    })
    .join(isMac ? "" : "+");
}

/**
 * Validate shortcut doesn't conflict with existing
 */
export function validateShortcut(
  keys: string,
  shortcuts: ShortcutConfig[],
  currentId?: string
): { valid: boolean; conflictsWith?: string } {
  const conflict = shortcuts.find(
    (s) => s.id !== currentId && s.keys === keys && s.enabled
  );

  if (conflict) {
    return {
      valid: false,
      conflictsWith: conflict.name,
    };
  }

  return { valid: true };
}
