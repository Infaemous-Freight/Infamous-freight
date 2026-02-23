import type { FastifyInstance } from "fastify";
import { pool } from "../lib/db";

export default async function loadRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async (req: any) => {
    const { rows } = await pool.query(
      "SELECT * FROM loads WHERE tenant_id = $1 ORDER BY created_at DESC",
      [req.user.tenant_id],
    );
    return rows;
  });

  app.post("/", { preHandler: [app.authenticate] }, async (req: any, reply) => {
    const { brokerId, rate, mileage, status = "Draft" } = req.body;

    const { rows } = await pool.query(
      "INSERT INTO loads (tenant_id, broker_id, rate, mileage, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.tenant_id, brokerId, rate, mileage, status],
    );

    reply.code(201).send(rows[0]);
  });
}
