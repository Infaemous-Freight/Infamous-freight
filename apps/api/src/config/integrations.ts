export interface IntegrationFeatureFlags {
  loadBoards: boolean;
  dat: boolean;
  truckstop: boolean;
  tracking: boolean;
  project44: boolean;
  fourKites: boolean;
  samsara: boolean;
  accounting: boolean;
  quickBooks: boolean;
  messaging: boolean;
  twilio: boolean;
  sendGrid: boolean;
  observability: boolean;
  sentry: boolean;
  analytics: boolean;
  mobileOperations: boolean;
}

function envFlag(name: string, defaultValue = false): boolean {
  const value = process.env[name];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function getIntegrationFeatureFlags(): IntegrationFeatureFlags {
  return {
    loadBoards: envFlag('ENABLE_LOAD_BOARD_INTEGRATIONS'),
    dat: envFlag('ENABLE_DAT_INTEGRATION'),
    truckstop: envFlag('ENABLE_TRUCKSTOP_INTEGRATION'),
    tracking: envFlag('ENABLE_TRACKING_INTEGRATIONS'),
    project44: envFlag('ENABLE_PROJECT44_INTEGRATION'),
    fourKites: envFlag('ENABLE_FOURKITES_INTEGRATION'),
    samsara: envFlag('ENABLE_SAMSARA_INTEGRATION'),
    accounting: envFlag('ENABLE_ACCOUNTING_INTEGRATIONS'),
    quickBooks: envFlag('ENABLE_QUICKBOOKS_INTEGRATION'),
    messaging: envFlag('ENABLE_MESSAGING_INTEGRATIONS'),
    twilio: envFlag('ENABLE_TWILIO_INTEGRATION'),
    sendGrid: envFlag('ENABLE_SENDGRID_INTEGRATION'),
    observability: envFlag('ENABLE_OBSERVABILITY_INTEGRATIONS'),
    sentry: envFlag('ENABLE_SENTRY_INTEGRATION'),
    analytics: envFlag('ENABLE_ANALYTICS_INTEGRATIONS'),
    mobileOperations: envFlag('ENABLE_MOBILE_OPERATIONS'),
  };
}
