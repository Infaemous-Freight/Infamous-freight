import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // PRISMA_SCHEMA_PATH (optional): override the default Prisma schema location ("prisma/schema.prisma")
  schema: env("PRISMA_SCHEMA_PATH", "prisma/schema.prisma"),
});
