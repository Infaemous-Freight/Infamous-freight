import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const currentDir = dirname(fileURLToPath(import.meta.url));
const prismaModulePath = existsSync(resolve(currentDir, "./prisma.cjs"))
  ? "./prisma.cjs"
  : "./prisma.js";
const prisma = require(prismaModulePath);

export default prisma;
