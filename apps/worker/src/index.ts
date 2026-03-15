export async function startWorker() {
  process.stdout.write("Infamous Freight worker started\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void startWorker();
}
