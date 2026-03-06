import { pathToFileURL } from "node:url";

export function startAIApp() {
  console.log("Infamous Freight AI app started");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  startAIApp();
}
