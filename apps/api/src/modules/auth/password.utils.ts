import argon2 from "argon2";
import { env } from "../../config/env.js";

const hashingOptions: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: env.argon2.memoryCost,
  timeCost: env.argon2.timeCost,
  parallelism: env.argon2.parallelism,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, hashingOptions);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return argon2.verify(passwordHash, password, hashingOptions);
}
