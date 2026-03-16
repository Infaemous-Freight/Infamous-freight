export function startAIApp() {
  console.log("Infæmous Freight AI app started");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startAIApp();
}
