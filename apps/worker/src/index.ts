export async function startWorker() {
  console.log("Infæmous Freight worker started");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void startWorker();
}
