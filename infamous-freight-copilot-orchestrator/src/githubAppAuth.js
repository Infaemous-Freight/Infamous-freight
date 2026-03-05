import { App } from "@octokit/app";

export function makeApp() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKeyRaw = process.env.GITHUB_PRIVATE_KEY_PEM;

  if (!appId) throw new Error("Missing GITHUB_APP_ID");
  if (!privateKeyRaw) throw new Error("Missing GITHUB_PRIVATE_KEY_PEM");

  // If env stored with \n, unescape
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return new App({ appId, privateKey });
}

export async function getInstallationOctokit(installationId) {
  const app = makeApp();
  return await app.getInstallationOctokit(Number(installationId));
}
