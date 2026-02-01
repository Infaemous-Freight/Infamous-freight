# Accessibility Testing Guide

## Overview

This guide ensures all web interfaces meet WCAG 2.1 AA standards. Accessibility is critical for inclusive user experience and legal compliance.

## Testing Tools

### 1. Automated Tools

#### axe DevTools
```bash
# Install Chrome extension: axe DevTools by Deque
# Reports on accessibility violations in real-time
```

#### Lighthouse (Built-in)
```bash
# Run accessibility audit
cd web
pnpm build
pnpm start &

# Chrome DevTools → Lighthouse → Accessibility
# Focus on: color contrast, ARIA labels, keyboard navigation
```

#### WAVE Browser Extension
```bash
# Install: WebAIM WAVE
# Highlights potential accessibility issues
```

#### eslint-plugin-jsx-a11y
```bash
# Already configured in web/eslint.config.js
# Catches accessibility issues at development time

# Run check:
pnpm lint:a11y
```

### 2. Manual Testing Checklist

#### Keyboard Navigation
- [ ] **Tab Order**: All interactive elements reachable via Tab key
  ```bash
  # Test: Press Tab repeatedly through entire page
  # Expected: Logical order (top-to-bottom, left-to-right)
  # Check: No keyboard traps
  ```

- [ ] **Focus Visible**: Clear focus indicator on all elements
  ```css
  /* Ensure focus is always visible */
  :focus {
    outline: 2px solid #4A90E2;
    outline-offset: 2px;
  }
  ```

- [ ] **Enter/Space Keys**: Buttons respond to Enter and Space
  ```bash
  # Test on all buttons/links
  ```

#### Color Contrast
- [ ] **Text Contrast**: Minimum 4.5:1 for small text, 3:1 for large
  ```bash
  # Use WebAIM Contrast Checker
  # Verify on all background combinations
  ```

- [ ] **Color Not Only Indicator**: Don't rely on color alone
  ```bash
  # Example: "Error (Red text)" → "Error: (Icon + Red text)"
  ```

#### Images & Icons
- [ ] **Alt Text**: All meaningful images have descriptive alt text
  ```jsx
  <img src="shipment.png" alt="Shipment in transit on map" />
  ```

- [ ] **Icon-Only Buttons**: Include aria-label
  ```jsx
  <button aria-label="Delete shipment">
    <TrashIcon />
  </button>
  ```

#### Forms
- [ ] **Labels**: All inputs have associated labels
  ```jsx
  <label htmlFor="email">Email Address</label>
  <input id="email" type="email" required />
  ```

- [ ] **Error Messages**: Linked to form fields
  ```jsx
  <input aria-describedby="email-error" />
  <p id="email-error" role="alert">Invalid email format</p>
  ```

- [ ] **Required Fields**: Marked with aria-required
  ```jsx
  <input aria-required="true" />
  ```

#### Screen Reader Testing
- [ ] **Text Content**: All text readable by screen readers
  ```bash
  # Test with: NVDA (Windows), JAWS, or VoiceOver (Mac)
  # Verify page structure makes sense
  ```

- [ ] **Landmarks**: Proper use of semantic HTML
  ```jsx
  <header>Navigation</header>
  <main>Content</main>
  <aside>Sidebar</aside>
  <footer>Footer</footer>
  ```

- [ ] **Skip Links**: Skip to main content available
  ```jsx
  <a href="#main-content" className="sr-only">
    Skip to main content
  </a>
  ```

#### Motion & Animation
- [ ] **Animations**: Respect prefers-reduced-motion
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
      transition: none !important;
    }
  }
  ```

- [ ] **No Auto-Play**: Videos/animations don't play automatically
  ```jsx
  <video controls>
    <source src="video.mp4" />
  </video>
  ```

#### Page Structure
- [ ] **Headings**: Proper hierarchy (h1, then h2, h3, etc.)
  ```jsx
  <h1>Page Title</h1>
  <h2>Section</h2>
  <h3>Subsection</h3>
  ```

- [ ] **No Empty Links**: All links have descriptive text
  ```jsx
  {/* ❌ Bad */}
  <a href="/shipment/123">Read more</a>

  {/* ✅ Good */}
  <a href="/shipment/123">View shipment details for package #123</a>
  ```

## Automated Testing

### Jest Accessibility Tests

```javascript
// web/__tests__/accessibility.test.js
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  test('Login page has no violations', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Form labels are associated with inputs', () => {
    render(<ShipmentForm />);
    const input = screen.getByLabelText('Origin Address');
    expect(input).toBeInTheDocument();
  });

  test('Error messages are announced to screen readers', async () => {
    render(<PaymentForm />);
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });
});
```

### Playwright E2E Accessibility Tests

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('Keyboard navigation works on dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Tab through all interactive elements
    let focusCount = 0;
    while (focusCount < 20) {
      await page.keyboard.press('Tab');
      focusCount++;
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focused);
    }
  });

  test('Color contrast meets WCAG AA', async ({ page }) => {
    const violations = await page.evaluate(() => {
      // Simple contrast check (would use axe-core in production)
      const elements = document.querySelectorAll('button, a, p');
      const low = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        // Simplified: check if text is readable
        if (style.color === style.backgroundColor) {
          low.push(el);
        }
      });
      return low.length;
    });

    expect(violations).toBe(0);
  });
});
```

## Accessibility Audit Checklist

| Area | Status | Notes |
|------|--------|-------|
| Keyboard Navigation | [ ] | All pages navigable via Tab |
| Color Contrast | [ ] | 4.5:1 for text, 3:1 for large |
| Alt Text | [ ] | All images have descriptive alt |
| Form Labels | [ ] | All inputs associated with labels |
| Error Messages | [ ] | Linked to fields, aria-live |
| Headings | [ ] | Proper hierarchy |
| Landmarks | [ ] | Semantic HTML used |
| Skip Links | [ ] | Skip to main content available |
| Focus Visible | [ ] | Clear focus indicators |
| Screen Reader | [ ] | Tested with NVDA/JAWS/VO |
| Motion/Animation | [ ] | Respects prefers-reduced-motion |
| Videos | [ ] | No auto-play, captions included |

## Common Issues & Fixes

### Issue: Low Color Contrast
```jsx
// ❌ Bad
<p style={{ color: '#999', backgroundColor: '#f5f5f5' }}>Light text</p>

// ✅ Good
<p style={{ color: '#333', backgroundColor: '#f5f5f5' }}>Light text</p>
```

### Issue: Missing Form Labels
```jsx
// ❌ Bad
<input type="email" placeholder="Email" />

// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Issue: Icon-Only Buttons
```jsx
// ❌ Bad
<button><TrashIcon /></button>

// ✅ Good
<button aria-label="Delete shipment">
  <TrashIcon aria-hidden="true" />
</button>
```

### Issue: Missing Skip Link
```jsx
// ✅ Good - Add at start of page
<a href="#main-content" className="sr-only">
  Skip to main content
</a>

<style>{`
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  .sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    white-space: normal;
  }
`}</style>

<main id="main-content">
  Page content here
</main>
```

## Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM**: https://webaim.org/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **Keyboard Navigation**: https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html

## Continuous Accessibility

- Run automated tests in CI/CD pipeline
- Include accessibility in code review checklist
- Test with real assistive technology users
- Monitor Lighthouse scores in production
- Train team on accessibility best practices

## Team Responsibilities

- **Developers**: Implement semantic HTML, test keyboard navigation
- **Designers**: Ensure color contrast, provide alt text direction
- **QA**: Manual testing with assistive tech
- **Product**: Prioritize accessibility in requirements
