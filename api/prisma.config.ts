import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: env("PRISMA_SCHEMA_PATH", "prisma/schema.prisma"),
});
