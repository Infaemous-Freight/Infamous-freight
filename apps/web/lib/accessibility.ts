/**
 * Accessibility Utilities - WCAG 2.1 AA Compliance Helpers
 * Provides utilities for making components accessible
 */

/**
 * Generate accessible ARIA attributes for interactive elements
 */
export const getAriaAttributes = (
  props: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    pressed?: boolean;
    current?: "page" | "step" | "location" | "date" | "time" | boolean;
    hidden?: boolean;
    live?: "polite" | "assertive" | "off";
    role?: string;
  } = {},
) => {
  const attrs: Record<string, any> = {};

  if (props.label) attrs["aria-label"] = props.label;
  if (props.describedBy) attrs["aria-describedby"] = props.describedBy;
  if (props.expanded !== undefined) attrs["aria-expanded"] = props.expanded;
  if (props.pressed !== undefined) attrs["aria-pressed"] = props.pressed;
  if (props.current) attrs["aria-current"] = props.current;
  if (props.hidden) attrs["aria-hidden"] = props.hidden;
  if (props.live) attrs["aria-live"] = props.live;
  if (props.role) attrs["role"] = props.role;

  return attrs;
};

/**
 * Check if color contrast meets WCAG AA standards
 * @param foreground - Foreground color (typically text)
 * @param background - Background color
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast ratio meets WCAG AA (4.5:1 or 3:1 for large text)
 */
export const meetsContrastRequirement = (
  foreground: string,
  background: string,
  isLargeText: boolean = false,
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Calculate relative luminance of a color
 */
const getLuminance = (color: string): number => {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Convert hex color to RGB array
 */
const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
};

/**
 * Announce message to screen readers
 * Creates a temporary live region to announce updates
 */
export const announceToScreenReader = (message: string, priority: "polite" | "assertive" = "polite") => {
  if (typeof document === "undefined") return; // Server-side

  const liveRegion = document.createElement("div");
  liveRegion.setAttribute("role", "status");
  liveRegion.setAttribute("aria-live", priority);
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.className = "sr-only"; // Screen reader only class
  liveRegion.textContent = message;

  document.body.appendChild(liveRegion);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
};

/**
 * Trap focus within a modal/dialog
 */
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  element.addEventListener("keydown", handleTabKey);

  // Focus first element
  firstElement.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleTabKey);
  };
};

/**
 * Restore focus to previously focused element
 */
export const createFocusManager = () => {
  let previouslyFocused: HTMLElement | null = null;

  return {
    save: () => {
      previouslyFocused = document.activeElement as HTMLElement;
    },
    restore: () => {
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
        previouslyFocused = null;
      }
    },
  };
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Get appropriate animation duration based on user preference
 */
export const getAnimationDuration = (defaultDuration: number): number => {
  return prefersReducedMotion() ? 0 : defaultDuration;
};

/**
 * Keyboard event handler helpers
 */
export const isEnterKey = (e: KeyboardEvent): boolean => e.key === "Enter";
export const isSpaceKey = (e: KeyboardEvent): boolean => e.key === " " || e.key === "Space";
export const isEscapeKey = (e: KeyboardEvent): boolean => e.key === "Escape" || e.key === "Esc";
export const isArrowKey = (e: KeyboardEvent): boolean =>
  ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);

/**
 * Handle click and keyboard activation
 */
export const handleActivation = (callback: () => void) => ({
  onClick: callback,
  onKeyDown: (e: KeyboardEvent) => {
    if (isEnterKey(e) || isSpaceKey(e)) {
      e.preventDefault();
      callback();
    }
  },
});

/**
 * Screen reader only CSS class styles
 */
export const srOnlyStyles: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
};

/**
 * Focus visible only styles (for keyboard navigation)
 */
export const focusVisibleStyles: React.CSSProperties = {
  outline: "2px solid #0066CC",
  outlineOffset: "2px",
};

/**
 * Validate form field accessibility
 */
export const validateFieldAccessibility = (fieldId: string): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  const field = document.getElementById(fieldId);

  if (!field) {
    issues.push("Field not found");
    return { valid: false, issues };
  }

  // Check for associated label
  const hasLabel =
    field.getAttribute("aria-label") ||
    field.getAttribute("aria-labelledby") ||
    document.querySelector(`label[for="${fieldId}"]`);

  if (!hasLabel) {
    issues.push("No accessible label found");
  }

  // Check for error message association
  const hasError = field.getAttribute("aria-invalid") === "true";
  if (hasError) {
    const errorId = field.getAttribute("aria-describedby");
    if (!errorId || !document.getElementById(errorId)) {
      issues.push("Error state without associated error message");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};

/**
 * Generate unique ID for accessibility associations
 */
let idCounter = 0;
export const generateAccessibleId = (prefix: string = "a11y"): string => {
  idCounter++;
  return `${prefix}-${idCounter}-${Date.now()}`;
};

const accessibility: Record<string, unknown> = {
  getAriaAttributes,
  meetsContrastRequirement,
  getContrastRatio,
  announceToScreenReader,
  trapFocus,
  createFocusManager,
  prefersReducedMotion,
  getAnimationDuration,
  isEnterKey,
  isSpaceKey,
  isEscapeKey,
  isArrowKey,
  handleActivation,
  srOnlyStyles,
  focusVisibleStyles,
  validateFieldAccessibility,
  generateAccessibleId,
};

export default accessibility;
