export function startAIApp() {
  process.stdout.write("Infamous Freight AI app started\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startAIApp();
}
