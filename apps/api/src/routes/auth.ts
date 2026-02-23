import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { pool } from "../lib/db";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (req: any, reply) => {
    const { tenantId, email, password, role = "dispatcher" } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      "INSERT INTO users (tenant_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, tenant_id, email, role",
      [tenantId, email, passwordHash, role],
    );

    reply.code(201).send(rows[0]);
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
