/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * UIKit Index & Usage Guide
 *
 * Complete component library for user-friendly interfaces
 */

export { Button, type ButtonProps } from "./Button";
export { Card, type CardProps } from "./Card";
export { Alert, type AlertProps } from "./Alert";
export { Input, type InputProps } from "./Input";
export { Tooltip, type TooltipProps } from "./Tooltip";
export { Modal, type ModalProps } from "./Modal";
export { Onboarding, type OnboardingProps, type OnboardingStep } from "./Onboarding";
export { EmptyState, type EmptyStateProps } from "./EmptyState";

/**
 * QUICK START EXAMPLES
 *
 * Copy and paste these patterns into your components
 */

/* ============================================================================
   BUTTONS
   ============================================================================ */

// Simple primary button
// <Button variant="primary" onClick={handleSave}>Save Changes</Button>

// Loading state
// <Button variant="primary" loading={isSaving}>Save</Button>

// Icon button
// <Button icon={<Plus />} onClick={handleAdd}>Add Item</Button>

// Full width on mobile
// <Button fullWidth size="lg">Create Shipment</Button>

/* ============================================================================
   FORMS
   ============================================================================ */

// Controlled input with validation
// <Input
//   label="Email Address"
//   type="email"
//   placeholder="you@example.com"
//   hint="We'll never share your email"
//   error={errors.email ? "Email is required" : undefined}
//   required
//   onChange={(e) => setEmail(e.target.value)}
// />

// Disabled input
// <Input label="Shipment ID" disabled value={shipmentId} />

// Input with icon
// <Input
//   label="Search"
//   icon={<SearchIcon />}
//   placeholder="Find shipping..."
//   onChange={handleSearch}
// />

/* ============================================================================
   ALERTS
   ============================================================================ */

// Success message
// <Alert
//   type="success"
//   title="Shipment created!"
//   message="Your shipment will be picked up tomorrow."
//       onClose={() => setShowSuccess(false)}
// />

// Error with action
// <Alert
//   type="error"
//   title="Payment failed"
//   message="Your card was declined. Please try another payment method."
//   action={{
//     label: "Update Payment",
//     onClick: () => navigate('/payment')
//   }}
// />

/* ============================================================================
   TOOLTIPS
   ============================================================================ */

// Help icon with tooltip
// <Tooltip content="Click to see tracking details">
//   <button>ℹ️</button>
// </Tooltip>

// Positioned tooltip
// <Tooltip
//   content="This shipment includes insurance"
//   position="right"
//   delay={200}
// >
//   <span>🛡️</span>
// </Tooltip>

/* ============================================================================
   MODALS/DIALOGS
   ============================================================================ */

// Confirmation dialog
// <Modal
//   isOpen={showDeleteConfirm}
//   title="Delete Shipment?"
//   onClose={() => setShowDeleteConfirm(false)}
//   actions={[
//     {
//       label: "Cancel",
//       onClick: () => setShowDeleteConfirm(false),
//       variant: "secondary"
//     },
//     {
//       label: "Delete Forever",
//       onClick: handleDelete,
//       variant: "danger"
//     }
//   ]}
// >
//   <p>This action cannot be undone. All tracking data will be lost.</p>
// </Modal>

/* ============================================================================
   ONBOARDING
   ============================================================================ */

// Interactive product tour
// <Onboarding
//   isOpen={showTour}
//   steps={[
//     {
//       id: 'welcome',
//       title: 'Welcome to Infæmous Freight',
//       description: 'Let\'s get you set up with your first shipment.',
//       image: '/onboarding/welcome.png'
//     },
//     {
//       id: 'dashboard',
//       title: 'Your Commands',
//       description: 'Track all your shipments from here.',
//       target: '.dashboard-widget'
//     }
//   ]}
//   onComplete={() => setShowTour(false)}
//   onClose={() => setShowTour(false)}
// />

/* ============================================================================
   EMPTY STATES
   ============================================================================ */

// No data found
// <EmptyState
//   icon="📦"
//   title="No shipments yet"
//   description="Create your first shipment to get started."
//   action={{
//     label: "Create Shipment",
//     onClick: () => navigate('/new')
//   }}
//   hint="Pro tip: You can import CSV files with up to 100 shipments at once."
// />

// Search no results
// <EmptyState
//   icon="🔍"
//   title="No results for 'INVALID'"
//   description="Try searching for a valid shipment ID."
// />

/* ============================================================================
   CARDS
   ============================================================================ */

// Shipment card
// <Card
//   title="SHIP-001234"
//   description="NYC → LAX"
//   icon="📦"
// >
//   <p>Status: <strong>In Transit</strong></p>
//   <p>ETA: Tomorrow 3:00 PM</p>
// </Card>

// Interactive card (clickable)
// <Card
//   title="Chicago Hub"
//   description="12 pending pickups"
//   interactive
//   onClick={() => navigate(`/hubs/${id}`)}
// >
//   Tap to view details
// </Card>

/* ============================================================================
   CONTEXT: HELP SYSTEM
   ============================================================================ */

// In your app root (_app.tsx):
// import { HelpProvider } from '@/context/HelpContext';
//
// export default function App({ Component, pageProps }) {
//   return (
//     <HelpProvider>
//       <Component {...pageProps} />
//     </HelpProvider>
//   );
// }

// In any component:
// import { useHelp } from '@/context/HelpContext';
//
// function MyComponent() {
//   const { showHelp, hideHelp, searchHelp } = useHelp();
//
//   return (
//     <button onClick={() => showHelp('shipments')}>
//       Help
//     </button>
//   );
// }

/**
 * COMPONENT DOCUMENTATION
 *
 * Detailed APIs and usage patterns for each component
 */

export interface ComponentUsageGuide {
  // Button usage
  // Props: variant, size, loading, fullWidth, icon, iconPosition, disabled, tooltip, ariaLabel
  // Variants: primary | secondary | danger | success | ghost
  // Sizes: sm | md | lg
  button: {
    primary: "Use for main actions (save, submit, create)";
    secondary: "Use for alternate actions (cancel, back)";
    danger: "Use for destructive actions (delete, remove)";
    ghost: "Use for tertiary actions (learn more, skip)";
  };

  // Input usage
  // Props: label, error, hint, icon, required, size, onChange, value
  // Sizes: sm | md | lg
  input: {
    withLabel: "Always include label prop";
    withHint: "Add context-specific help text";
    withError: "Show validation errors in real-time";
    accessibility: "All inputs must have labels for screen readers";
  };

  // Alert usage
  // Props: type, title, message, icon, onClose, action
  // Types: success | error | warning | info
  alert: {
    autoClose: "Consider auto-dismissing after 5 seconds";
    withAction: "Add action when user can respond";
    stacking: "Show multiple alerts in a stack";
    persistence: "Keep important alerts (errors) visible";
  };

  // Modal usage
  // Props: isOpen, onClose, title, children, actions, closeOnBackdrop
  modal: {
    destructive: "Always show confirmation for destructive actions";
    form: "Use for complex forms in modals";
    accessibility: "Modal should trap focus and allow Escape key";
    responsive: "Modal collapses to full-screen on mobile";
  };

  // Onboarding usage
  // Props: steps, isOpen, onClose, onComplete
  // stepTypes: information | interactive | video
  onboarding: {
    firstTime: "Show for first-time users";
    progressive: "Guide users through 5-7 steps max";
    interactive: "Allow user to interact with UI during tour";
    skipOption: "Always allow users to skip onboarding";
  };

  // EmptyState usage
  // Props: icon, title, description, action, illustration, hint
  emptyState: {
    actionable: "Always provide a clear next action";
    helpful: "Include pro tips or hints";
    visual: "Use icons or illustrations";
    contextual: "Different states for different scenarios";
  };
}

/**
 * ACCESSIBILITY CHECKLIST FOR EACH COMPONENT
 */

export const accessibilityChecklist = {
  button: [
    '✅ Descriptive text (not "Click here")',
    "✅ Focus visible (blue outline)",
    "✅ Keyboard accessible (Enter/Space)",
    "✅ ARIA labels for icon-only buttons",
    "✅ Disabled state prevents interaction",
  ],
  input: [
    "✅ Label associated with input",
    "✅ Error messages with aria-describedby",
    "✅ Required indication",
    "✅ Hint text associated with aria-describedby",
    "✅ Focus visible",
  ],
  alert: [
    '✅ Role="alert" for important alerts',
    '✅ aria-live="polite" for non-critical',
    '✅ aria-live="assertive" for errors',
    "✅ Color not only indicator",
    "✅ Icon + text combination",
  ],
  modal: [
    '✅ Role="dialog" and aria-modal="true"',
    "✅ Focus trapped inside modal",
    "✅ Close with Escape key",
    "✅ aria-labelledby points to title",
    "✅ Initial focus on primary action",
  ],
  form: [
    "✅ Proper form structure with <form>",
    "✅ All inputs labeled",
    "✅ Error messages linked to inputs",
    "✅ Success message after submission",
    "✅ Proper heading hierarchy",
  ],
};

/**
 * MOBILE-SPECIFIC GUIDELINES
 */

export const mobileGuidelines = {
  buttons: {
    minimumSize: "48px × 48px",
    spacing: "8px minimum between targets",
    fullWidth: "Use on forms for easier tapping",
    example: '<Button fullWidth size="lg">Save</Button>',
  },
  inputs: {
    fontSize: "16px to prevent zoom on iOS",
    padding: "Minimum 12px",
    width: "100% on mobile",
    example: '<Input style={{ fontSize: "16px" }} />',
  },
  forms: {
    singleColumn: "Stack fields vertically on mobile",
    largeInputs: "Bigger touch targets",
    grouping: "Use sections for related fields",
    example: "See ShipmentForm in examples",
  },
};

export default {
  button: "For all clickable actions",
  card: "For content containers",
  alert: "For system messages",
  input: "For form fields",
  tooltip: "For contextual help",
  modal: "For important dialogs",
  onboarding: "For new user guidance",
  emptyState: "For no-data states",
};
