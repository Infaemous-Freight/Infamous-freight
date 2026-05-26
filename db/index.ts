import { drizzle } from "drizzle-orm/netlify-db";
// NOTE: Source file is TypeScript (`db/index.ts`). Use this path for edits; `db/index.js` is build output only.
import * as schema from "./schema.js";

export const db = drizzle({ schema });
