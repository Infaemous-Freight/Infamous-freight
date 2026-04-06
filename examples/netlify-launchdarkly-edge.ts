import { init as initLD } from "@netlify/launchdarkly-server-sdk";

interface Bindings {
  LAUNCHDARKLY_CLIENT_SIDE_ID?: string;
  LAUNCHDARKLY_FLAG_KEY?: string;
}

export default {
  async fetch(_request: Request, env: Bindings): Promise<Response> {
    const clientSideID = env.LAUNCHDARKLY_CLIENT_SIDE_ID;
    if (!clientSideID) {
      return new Response(
        JSON.stringify({
          error: "LaunchDarkly is not configured",
          missingEnvVar: "LAUNCHDARKLY_CLIENT_SIDE_ID",
        }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const flagKey = env.LAUNCHDARKLY_FLAG_KEY ?? "enableMyNewFeature";
    const context = { kind: "user" as const, key: "my-user-key-1" };

    const client = initLD(clientSideID);
    await client.waitForInitialization();

    const flagValue = await client.variation(flagKey, context, false);

    return new Response(JSON.stringify({ [flagKey]: flagValue }), {
      headers: { "content-type": "application/json" },
    });
  },
};
