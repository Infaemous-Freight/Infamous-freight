import { init as initLaunchDarkly } from "@netlify/launchdarkly-server-sdk";

type LaunchDarklyContext = {
  kind: "user";
  key: string;
};

type LaunchDarklyEvalResult = {
  configured: boolean;
  value: boolean;
};

let initPromise: Promise<{
  variation: (flagKey: string, context: LaunchDarklyContext, defaultValue: boolean) => Promise<boolean>;
}> | null = null;

function getClientSideId(): string | undefined {
  const value = process.env.LAUNCHDARKLY_CLIENT_SIDE_ID;
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function getClient() {
  const clientSideId = getClientSideId();
  if (!clientSideId) {
    return null;
  }

  if (!initPromise) {
    const client = initLaunchDarkly(clientSideId);
    initPromise = client.waitForInitialization().then(() => client);
  }

  return initPromise;
}

export async function evaluateLaunchDarklyFlag(
  flagKey: string,
  context: LaunchDarklyContext,
  defaultValue = false,
): Promise<LaunchDarklyEvalResult> {
  const client = await getClient();
  if (!client) {
    return { configured: false, value: defaultValue };
  }

  try {
    const value = await client.variation(flagKey, context, defaultValue);
    return { configured: true, value };
  } catch (error) {
    console.error("LaunchDarkly flag evaluation failed", {
      flagKey,
      error: error instanceof Error ? error.message : String(error),
    });
    return { configured: true, value: defaultValue };
  }
}
