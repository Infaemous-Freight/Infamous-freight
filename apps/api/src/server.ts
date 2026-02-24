/**
 * NOTE:
 * The API service uses the Express/CommonJS entrypoint at `src/server.js`.
 * This TypeScript file previously contained an experimental Fastify server
 * implementation that was not wired into the build/scripts and depended on
 * undeclared packages (`fastify`, `@fastify/cors`, `@fastify/jwt`).
 *
 * To avoid an unsupported, conflicting entrypoint and missing-dependency
 * issues, the Fastify implementation has been removed. This file is kept as
 * a no-op placeholder.
 */

// Export a no-op to make this module valid without affecting runtime behavior.
export function noopServerPlaceholder(): void {
  // intentionally empty
}
