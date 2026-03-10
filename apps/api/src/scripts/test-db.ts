import { db } from "../lib/db.js";

async function main() {
  const result = await db.$queryRaw`SELECT NOW()`;
  console.log("Database connection OK:", result);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
