// Accessibility utilities and components
import { useEffect } from "react";

// Skip to main content link
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}

// Live region announcer for screen readers
export function LiveRegion({ message, priority = "polite" }: { message: string; priority?: "polite" | "assertive" }) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Focus trap for modals
export function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    element.addEventListener("keydown", handleTab);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener("keydown", handleTab);
    };
  }, [isActive, ref]);
}

// Announce page title changes to screen readers
export function usePageAnnouncement(title: string) {
  useEffect(() => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.className = "sr-only";
    announcement.textContent = `Navigated to ${title}`;
    document.body.appendChild(announcement);

    const timer = setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    };
  }, [title]);
}

// Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
export function getContrastRatio(foreground: string, background: string): number {
  const getRGB = (color: string): [number, number, number] => {
    const hex = color.replace("#", "");
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  };

  const getLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map((val) => {
      const srgb = val / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(getRGB(foreground));
  const l2 = getLuminance(getRGB(background));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Ensure keyboard navigation
export function useKeyboardNavigation(
  onEscape?: () => void,
  onEnter?: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        onEscape();
      }
      if (e.key === "Enter" && onEnter) {
        onEnter();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEscape, onEnter]);
}

// Screen reader only text
export function SROnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
