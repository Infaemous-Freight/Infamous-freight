import argon2 from "argon2";
import { env } from "../../config/env.js";

const hashingOptions: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: env.argon2.memoryCost,
  timeCost: env.argon2.timeCost,
  parallelism: env.argon2.parallelism,
};

function withPepper(password: string): string {
  if (!env.passwordPepper) {
    throw new Error("PASSWORD_PEPPER must be configured");
  }
  return `${password}${env.passwordPepper}`;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(withPepper(password), hashingOptions);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  // First, try verification using the peppered password (current scheme).
  const isValidWithPepper = await argon2.verify(passwordHash, withPepper(password), hashingOptions);

  // If verification succeeded, or no pepper is configured, return the result immediately.
  if (isValidWithPepper || !env.passwordPepper) {
    return isValidWithPepper;
  }

  // Legacy fallback: try verifying without the pepper for hashes created before peppering was enabled.
  return argon2.verify(passwordHash, password, hashingOptions);
}
