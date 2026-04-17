import { NextResponse } from "next/server";

import { evaluateLaunchDarklyFlag } from "@/lib/launchdarkly";

export const runtime = "nodejs";

const DEFAULT_FLAG_KEY = "enableMyNewFeature";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flagKey = (searchParams.get("flagKey") ?? process.env.LAUNCHDARKLY_FLAG_KEY ?? DEFAULT_FLAG_KEY).trim();
  const userKey = (searchParams.get("userKey") ?? "anonymous-netlify-user").trim();

  if (!flagKey) {
    return NextResponse.json({ error: "Missing flag key" }, { status: 400 });
  }

  const evaluation = await evaluateLaunchDarklyFlag(
    flagKey,
    { kind: "user", key: userKey || "anonymous-netlify-user" },
    false,
  );

  if (!evaluation.configured) {
    return NextResponse.json(
      {
        error: "LaunchDarkly is not configured",
        missingEnvVar: "LAUNCHDARKLY_CLIENT_SIDE_ID",
      },
      { status: 503 },
    );
  }

  // Note: the site-level `/api/*` rule in netlify.toml currently forces
  // `Cache-Control: no-store`, which will override anything set here. If
  // you want shared-cache relief for flag evaluations, narrow that rule or
  // add a more specific one for `/api/launchdarkly` and then set a real
  // Cache-Control header on this response.
  return NextResponse.json({
    flagKey,
    value: evaluation.value,
  });
}
