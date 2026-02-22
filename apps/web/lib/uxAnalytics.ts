/**
 * UX Analytics Tracker
 * Tracks user interactions with UX features for monitoring and optimization
 */

import { trackEvent } from "../lib/analytics";

// UX Event Categories
export enum UXEventCategory {
  NAVIGATION = "ux_navigation",
  KEYBOARD = "ux_keyboard",
  HELP = "ux_help",
  MOBILE = "ux_mobile",
  ACCESSIBILITY = "ux_accessibility",
  SEARCH = "ux_search",
}

// UX Event Actions
export enum UXEventAction {
  // Navigation
  NAV_CLICK = "nav_click",
  BREADCRUMB_CLICK = "breadcrumb_click",
  USER_MENU_OPEN = "user_menu_open",
  MOBILE_MENU_TOGGLE = "mobile_menu_toggle",

  // Keyboard
  SHORTCUT_USED = "shortcut_used",
  SHORTCUTS_MODAL_OPEN = "shortcuts_modal_open",
  SEARCH_SHORTCUT = "search_shortcut",
  HELP_SHORTCUT = "help_shortcut",
  NAVIGATION_SHORTCUT = "navigation_shortcut",

  // Help
  HELP_WIDGET_OPEN = "help_widget_open",
  HELP_WIDGET_CLOSE = "help_widget_close",
  HELP_ARTICLE_VIEW = "help_article_view",
  HELP_SEARCH = "help_search",
  CONTACT_SUPPORT = "contact_support",

  // Search
  SEARCH_OPEN = "search_open",
  SEARCH_QUERY = "search_query",
  SEARCH_RESULT_CLICK = "search_result_click",
  SEARCH_NO_RESULTS = "search_no_results",

  // Mobile
  HAPTIC_FEEDBACK = "haptic_feedback",
  SWIPE_GESTURE = "swipe_gesture",
  LONG_PRESS = "long_press",

  // Accessibility
  SCREEN_READER_USED = "screen_reader_used",
  KEYBOARD_NAVIGATION = "keyboard_navigation",
  HIGH_CONTRAST_MODE = "high_contrast_mode",
  SKIP_LINK_USED = "skip_link_used",
}

interface UXEvent {
  category: UXEventCategory;
  action: UXEventAction;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track a UX event
 */
export function trackUXEvent(event: UXEvent): void {
  const { category, action, label, value, metadata } = event;

  // Track with standard analytics
  trackEvent(`${category}:${action}`, {
    label: label ?? undefined,
    value: value ?? undefined,
    ...metadata,
    timestamp: Date.now(),
  } as Record<string, string | number | boolean | undefined>);

  // Log for debugging in development
  if (process.env.NODE_ENV === "development") {
    console.log("📊 UX Event:", {
      category,
      action,
      label,
      value,
      metadata,
    });
  }
}

/**
 * Track navigation events
 */
export const trackNavigation = {
  click: (destination: string) => {
    trackUXEvent({
      category: UXEventCategory.NAVIGATION,
      action: UXEventAction.NAV_CLICK,
      label: destination,
    });
  },

  breadcrumb: (path: string, level: number) => {
    trackUXEvent({
      category: UXEventCategory.NAVIGATION,
      action: UXEventAction.BREADCRUMB_CLICK,
      label: path,
      value: level,
    });
  },

  userMenu: () => {
    trackUXEvent({
      category: UXEventCategory.NAVIGATION,
      action: UXEventAction.USER_MENU_OPEN,
    });
  },

  mobileMenu: (isOpen: boolean) => {
    trackUXEvent({
      category: UXEventCategory.NAVIGATION,
      action: UXEventAction.MOBILE_MENU_TOGGLE,
      label: isOpen ? "open" : "close",
    });
  },
};

/**
 * Track keyboard shortcuts
 */
export const trackKeyboard = {
  shortcut: (keys: string, action: string) => {
    trackUXEvent({
      category: UXEventCategory.KEYBOARD,
      action: UXEventAction.SHORTCUT_USED,
      label: keys,
      metadata: { action },
    });
  },

  modalOpen: () => {
    trackUXEvent({
      category: UXEventCategory.KEYBOARD,
      action: UXEventAction.SHORTCUTS_MODAL_OPEN,
    });
  },

  search: () => {
    trackUXEvent({
      category: UXEventCategory.KEYBOARD,
      action: UXEventAction.SEARCH_SHORTCUT,
      label: "⌘K",
    });
  },

  help: () => {
    trackUXEvent({
      category: UXEventCategory.KEYBOARD,
      action: UXEventAction.HELP_SHORTCUT,
      label: "⌘/",
    });
  },

  navigation: (destination: string, keys: string) => {
    trackUXEvent({
      category: UXEventCategory.KEYBOARD,
      action: UXEventAction.NAVIGATION_SHORTCUT,
      label: destination,
      metadata: { keys },
    });
  },
};

/**
 * Track help widget usage
 */
export const trackHelp = {
  open: (page: string) => {
    trackUXEvent({
      category: UXEventCategory.HELP,
      action: UXEventAction.HELP_WIDGET_OPEN,
      label: page,
    });
  },

  close: (timeOpen: number) => {
    trackUXEvent({
      category: UXEventCategory.HELP,
      action: UXEventAction.HELP_WIDGET_CLOSE,
      value: timeOpen,
    });
  },

  articleView: (articleId: string) => {
    trackUXEvent({
      category: UXEventCategory.HELP,
      action: UXEventAction.HELP_ARTICLE_VIEW,
      label: articleId,
    });
  },

  search: (query: string, resultsCount: number) => {
    trackUXEvent({
      category: UXEventCategory.HELP,
      action: UXEventAction.HELP_SEARCH,
      label: query,
      value: resultsCount,
    });
  },

  contactSupport: (method: string) => {
    trackUXEvent({
      category: UXEventCategory.HELP,
      action: UXEventAction.CONTACT_SUPPORT,
      label: method,
    });
  },
};

/**
 * Track search usage
 */
export const trackSearch = {
  open: (trigger: "keyboard" | "click") => {
    trackUXEvent({
      category: UXEventCategory.SEARCH,
      action: UXEventAction.SEARCH_OPEN,
      label: trigger,
    });
  },

  query: (query: string, resultsCount: number, timeToResults: number) => {
    trackUXEvent({
      category: UXEventCategory.SEARCH,
      action: UXEventAction.SEARCH_QUERY,
      label: query,
      value: resultsCount,
      metadata: { timeToResults },
    });
  },

  resultClick: (query: string, resultIndex: number, resultType: string) => {
    trackUXEvent({
      category: UXEventCategory.SEARCH,
      action: UXEventAction.SEARCH_RESULT_CLICK,
      label: query,
      value: resultIndex,
      metadata: { resultType },
    });
  },

  noResults: (query: string) => {
    trackUXEvent({
      category: UXEventCategory.SEARCH,
      action: UXEventAction.SEARCH_NO_RESULTS,
      label: query,
    });
  },
};

/**
 * Track mobile interactions
 */
export const trackMobile = {
  haptic: (type: "light" | "medium" | "heavy" | "success" | "warning" | "error") => {
    trackUXEvent({
      category: UXEventCategory.MOBILE,
      action: UXEventAction.HAPTIC_FEEDBACK,
      label: type,
    });
  },

  swipe: (direction: "left" | "right" | "up" | "down", context: string) => {
    trackUXEvent({
      category: UXEventCategory.MOBILE,
      action: UXEventAction.SWIPE_GESTURE,
      label: direction,
      metadata: { context },
    });
  },

  longPress: (element: string, duration: number) => {
    trackUXEvent({
      category: UXEventCategory.MOBILE,
      action: UXEventAction.LONG_PRESS,
      label: element,
      value: duration,
    });
  },
};

/**
 * Track accessibility feature usage
 */
export const trackAccessibility = {
  screenReader: (action: string) => {
    trackUXEvent({
      category: UXEventCategory.ACCESSIBILITY,
      action: UXEventAction.SCREEN_READER_USED,
      label: action,
    });
  },

  keyboardNav: (element: string) => {
    trackUXEvent({
      category: UXEventCategory.ACCESSIBILITY,
      action: UXEventAction.KEYBOARD_NAVIGATION,
      label: element,
    });
  },

  highContrast: (enabled: boolean) => {
    trackUXEvent({
      category: UXEventCategory.ACCESSIBILITY,
      action: UXEventAction.HIGH_CONTRAST_MODE,
      label: enabled ? "enabled" : "disabled",
    });
  },

  skipLink: (target: string) => {
    trackUXEvent({
      category: UXEventCategory.ACCESSIBILITY,
      action: UXEventAction.SKIP_LINK_USED,
      label: target,
    });
  },
};

/**
 * Calculate and track UX metrics
 */
export const trackUXMetrics = {
  /**
   * Track time to complete a task
   */
  taskCompletion: (taskName: string, startTime: number, success: boolean) => {
    const duration = Date.now() - startTime;
    trackEvent("ux_task_completion", {
      task: taskName,
      duration,
      success,
    });
  },

  /**
   * Track navigation depth (clicks to reach destination)
   */
  navigationDepth: (destination: string, clicks: number) => {
    trackEvent("ux_navigation_depth", {
      destination,
      clicks,
    });
  },

  /**
   * Track error recovery
   */
  errorRecovery: (errorType: string, recovered: boolean, timeToRecover?: number) => {
    trackEvent("ux_error_recovery", {
      errorType,
      recovered,
      timeToRecover,
    });
  },

  /**
   * Track feature adoption
   */
  featureUsage: (feature: string, firstUse: boolean) => {
    trackEvent("ux_feature_usage", {
      feature,
      firstUse,
    });
  },
};

/**
 * Hook to track page-specific UX metrics
 */
export function useUXTracking(pageName: string) {
  const startTime = Date.now();

  // Track page entry
  trackEvent("ux_page_enter", { page: pageName });

  // Return cleanup function
  return () => {
    const timeOnPage = Date.now() - startTime;
    trackEvent("ux_page_exit", {
      page: pageName,
      duration: timeOnPage,
    });
  };
}

/**
 * Detect and track accessibility tool usage
 */
export function detectAccessibilityTools() {
  // Detect screen reader
  const hasScreenReader =
    typeof window !== "undefined" &&
    (window.navigator.userAgent.includes("NVDA") ||
      window.navigator.userAgent.includes("JAWS") ||
      // @ts-ignore
      window.navigator.userAgent.includes("VoiceOver") ||
      // @ts-ignore
      window.navigator.userAgent.includes("TalkBack"));

  if (hasScreenReader) {
    trackAccessibility.screenReader("detected");
  }

  // Detect high contrast mode
  if (typeof window !== "undefined" && window.matchMedia) {
    const highContrast = window.matchMedia("(prefers-contrast: high)").matches;
    if (highContrast) {
      trackAccessibility.highContrast(true);
    }
  }

  // Track reduced motion preference
  if (typeof window !== "undefined" && window.matchMedia) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      trackEvent("ux_reduced_motion", { enabled: true });
    }
  }
}
