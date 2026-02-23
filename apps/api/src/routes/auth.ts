import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { pool } from "../lib/db";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (req: any, reply) => {
    const { email, password, role = "dispatcher", tenantName } = req.body;

    // Basic input validation
    if (typeof email !== "string" || !email.includes("@")) {
      return reply.code(400).send({ error: "Invalid email" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return reply.code(400).send({ error: "Password must be at least 8 characters long" });
    }

    const allowedRoles = ["dispatcher", "driver", "admin"];
    if (typeof role !== "string" || !allowedRoles.includes(role)) {
      return reply.code(400).send({ error: "Invalid role" });
    }

    if (typeof tenantName !== "string" || tenantName.trim().length === 0) {
      return reply.code(400).send({ error: "Invalid tenant name" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create a new tenant for self-signup instead of trusting a caller-supplied tenantId
      const tenantResult = await client.query(
        "INSERT INTO tenants (name) VALUES ($1) RETURNING id",
        [tenantName.trim()],
      );
      const tenantId = tenantResult.rows[0].id;

      const { rows } = await client.query(
        "INSERT INTO users (tenant_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, email, role",
        [tenantId, email, passwordHash, role],
      );

      await client.query("COMMIT");
      reply.code(201).send(rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  app.post("/login", async (req: any, reply) => {
    const { email, password } = req.body;

    const { rows } = await pool.query(
      "SELECT id, tenant_id, email, role, password_hash FROM users WHERE email = $1",
      [email],
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({
      id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      email: user.email,
    });

    return { token };
  });
}
