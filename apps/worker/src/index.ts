export async function startWorker(): Promise<void> {
  // Worker bootstrap placeholder.
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void startWorker();
}
