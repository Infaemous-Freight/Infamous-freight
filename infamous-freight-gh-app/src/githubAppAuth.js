import { App } from "@octokit/app";

export function makeApp() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY_PEM?.replace(/\\n/g, "\n");

  if (!appId || !privateKey) {
    throw new Error("Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY_PEM");
  }

  return new App({ appId, privateKey });
}

export async function getInstallationOctokit(installationId) {
  const app = makeApp();
  return app.getInstallationOctokit(Number(installationId));
}
