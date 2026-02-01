/**
 * Edge Config Setup for Vercel
 *
 * Usage:
 * 1. Install: pnpm add @vercel/edge-config
 * 2. Create Edge Config in Vercel Dashboard
 * 3. Add EDGE_CONFIG env variable to Vercel
 * 4. Use this utility to read config values
 *
 * @see https://vercel.com/docs/storage/edge-config
 */

// Uncomment when @vercel/edge-config is installed
// import { get, getAll } from '@vercel/edge-config';

/**
 * Feature flags configuration structure
 */
export interface FeatureFlags {
  // Core features
  enableWebSockets: boolean;
  enableRealTimeNotifications: boolean;
  enableAdvancedAnalytics: boolean;

  // Payment features
  enablePayPal: boolean;
  enableStripe: boolean;
  enableCrypto: boolean;

  // UI features
  enableDarkMode: boolean;
  enableBetaFeatures: boolean;
  enableA11yMode: boolean;

  // Performance features
  enableCDN: boolean;
  enableImageOptimization: boolean;
  enablePrefetching: boolean;

  // Regional features
  enabledRegions: string[];
  maintenanceMode: boolean;

  // Experiments
  experiments: {
    [key: string]: {
      enabled: boolean;
      rolloutPercentage: number;
      variants: string[];
    };
  };
}

/**
 * Default feature flags (fallback when Edge Config unavailable)
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core features
  enableWebSockets: false,
  enableRealTimeNotifications: false,
  enableAdvancedAnalytics: true,

  // Payment features
  enablePayPal: true,
  enableStripe: true,
  enableCrypto: false,

  // UI features
  enableDarkMode: true,
  enableBetaFeatures: false,
  enableA11yMode: true,

  // Performance features
  enableCDN: true,
  enableImageOptimization: true,
  enablePrefetching: true,

  // Regional features
  enabledRegions: ["US", "CA", "GB", "AU"],
  maintenanceMode: false,

  // Experiments
  experiments: {
    newDashboard: {
      enabled: false,
      rolloutPercentage: 0,
      variants: ["control", "variant-a"],
    },
    aiAssistant: {
      enabled: false,
      rolloutPercentage: 0,
      variants: ["control", "variant-a", "variant-b"],
    },
  },
};

/**
 * Get feature flags from Edge Config (with fallback)
 *
 * @returns Feature flags object
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    // Uncomment when Edge Config is set up
    // const flags = await get<FeatureFlags>('feature-flags');
    // return flags || DEFAULT_FEATURE_FLAGS;

    // For now, return defaults
    return DEFAULT_FEATURE_FLAGS;
  } catch (error) {
    console.error("Failed to fetch feature flags:", error);
    return DEFAULT_FEATURE_FLAGS;
  }
}

/**
 * Check if a feature is enabled
 *
 * @param feature - Feature key to check
 * @returns Boolean indicating if feature is enabled
 */
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  const flags = await getFeatureFlags();
  return Boolean(flags[feature]);
}

/**
 * Check if a feature is enabled for a specific region
 *
 * @param feature - Feature key to check
 * @param region - Region code (e.g., 'US', 'GB')
 * @returns Boolean indicating if feature is enabled for region
 */
export async function isFeatureEnabledForRegion(
  feature: keyof FeatureFlags,
  region: string,
): Promise<boolean> {
  const flags = await getFeatureFlags();
  const isEnabled = Boolean(flags[feature]);
  const regionEnabled = flags.enabledRegions.includes(region);
  return isEnabled && regionEnabled;
}

/**
 * Get experiment variant for user (A/B testing)
 *
 * @param experimentKey - Experiment identifier
 * @param userId - User identifier for consistent assignment
 * @returns Variant name or 'control'
 */
export async function getExperimentVariant(experimentKey: string, userId: string): Promise<string> {
  const flags = await getFeatureFlags();
  const experiment = flags.experiments[experimentKey];

  if (!experiment || !experiment.enabled) {
    return "control";
  }

  // Consistent hash-based assignment
  const hash = hashString(userId + experimentKey);
  const isInExperiment = hash % 100 < experiment.rolloutPercentage;

  if (!isInExperiment) {
    return "control";
  }

  // Assign variant based on hash
  const variantIndex = hash % experiment.variants.length;
  return experiment.variants[variantIndex] || "control";
}

/**
 * Simple string hash function for consistent variant assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Maintenance mode check
 *
 * @returns Boolean indicating if site is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags.maintenanceMode;
}

/**
 * Get all config values from Edge Config
 *
 * @returns All config values
 */
export async function getAllConfig(): Promise<Record<string, unknown>> {
  try {
    // Uncomment when Edge Config is set up
    // return await getAll();

    return {
      "feature-flags": DEFAULT_FEATURE_FLAGS,
    };
  } catch (error) {
    console.error("Failed to fetch config:", error);
    return {};
  }
}
