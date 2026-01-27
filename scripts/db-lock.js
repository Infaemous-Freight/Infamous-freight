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
let clientClosed = false;

const releaseLock = async () => {
  // Make releaseLock idempotent: if we've already closed the client, do nothing.
  if (clientClosed) {
    return;
  }

  try {
    if (lockAcquired) {
      await client.query("DELETE FROM deploy_locks WHERE lock_name = $1", [lockName]);
      console.log(`Lock released: ${lockName}`);
    }
  } catch (error) {
    // If the connection is already closed or lost, releasing the lock may fail.
    console.error("Error while releasing DB lock", error);
  } finally {
    if (!clientClosed) {
      try {
        await client.end();
      } catch (endError) {
        console.error("Error while closing DB client", endError);
      } finally {
        clientClosed = true;
      }
    }
  }
};

const handleShutdown = async () => {
  try {
    await releaseLock();
  } catch (error) {
    console.error("Failed to release lock cleanly", error);
  } finally {
    // Ensure process terminates after cleanup completes
    process.exit(1);
  }
};


process.on("SIGINT", () => void handleShutdown());
process.on("SIGTERM", () => void handleShutdown());
process.on("uncaughtException", (error) => {
  console.error(error);
  void handleShutdown();
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

// Keep the process alive so the lock is held until an external signal
// (e.g., SIGINT or SIGTERM) triggers a clean shutdown and lock release.
console.log(`Lock ${lockName} is now held; waiting for termination signal to release it.`);
await new Promise(() => {});
