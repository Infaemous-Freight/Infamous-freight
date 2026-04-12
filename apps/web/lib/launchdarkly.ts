import { init as initLaunchDarkly } from "@netlify/launchdarkly-server-sdk";

type LDContext = {
  kind: string;
  key: string;
  [key: string]: string | number | boolean | undefined;
};

/**
 * Evaluate a LaunchDarkly flag using Netlify's LaunchDarkly SDK.
 * Returns fallbackValue when LaunchDarkly is not configured.
 */
export async function evaluateLaunchDarklyFlag(
  flagKey: string,
  context: LDContext,
  fallbackValue = false,
): Promise<boolean> {
  const clientSideId = process.env.LAUNCHDARKLY_CLIENT_SIDE_ID;
  if (!clientSideId) {
    return fallbackValue;
  }

  const client = initLaunchDarkly(clientSideId);
  const timeoutMs = 3000;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("LaunchDarkly initialization timed out")), timeoutMs);
  });

  try {
    await Promise.race([client.waitForInitialization(), timeoutPromise]);
    return await client.variation(flagKey, context, fallbackValue);
  } catch {
    return fallbackValue;
  } finally {
    await client.close?.();
  }
}
