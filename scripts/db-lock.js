import pg from "pg";

const { Client } = pg;

const lockName = process.argv[2] || "migrations";
const timeoutMs = Number(process.argv[3] || 120000);
const retryDelayMs = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(2);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
const start = Date.now();
let lockAcquired = false;

const releaseLock = async () => {
  if (!lockAcquired) {
    await client.end();
    return;
  }

  await client.query("DELETE FROM deploy_locks WHERE lock_name = $1", [lockName]);
  await client.end();
  console.log(`Lock released: ${lockName}`);
};

const handleShutdown = async (signal) => {
  try {
    await releaseLock();
  } catch (error) {
    console.error("Failed to release lock cleanly", error);
  } finally {
    if (signal) {
      process.kill(process.pid, signal);
    }
  }
};

process.on("SIGINT", () => void handleShutdown("SIGINT"));
process.on("SIGTERM", () => void handleShutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
  console.error(error);
  void handleShutdown("SIGTERM");
});
process.on("beforeExit", () => releaseLock());

await client.connect();

while (true) {
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO deploy_locks(lock_name) VALUES ($1)", [lockName]);
    await client.query("COMMIT");
    lockAcquired = true;
    console.log(`Lock acquired: ${lockName}`);
    break;
  } catch (error) {
    await client.query("ROLLBACK");
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) {
      console.error(`Failed to acquire lock within ${timeoutMs}ms`);
      process.exit(1);
    }
    console.log("Lock busy, retrying...");
    await sleep(retryDelayMs);
  }
}
