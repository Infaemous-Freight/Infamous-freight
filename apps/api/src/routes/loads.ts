import type { FastifyInstance } from "fastify";
import { pool } from "../lib/db";
import { ApiResponse, HTTP_STATUS } from "@infamous-freight/shared";

export default async function loadRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate] },
    async (req: any, reply) => {
      const { rows } = await pool.query(
        "SELECT * FROM loads WHERE tenant_id = $1 ORDER BY created_at DESC",
        [req.user.tenant_id],
      );

      return reply
        .code(HTTP_STATUS.OK)
        .send(new ApiResponse({ success: true, data: rows }));
    },
  );

  app.post(
    "/",
    { preHandler: [app.authenticate] },
    async (req: any, reply) => {
      const { brokerId, rate, mileage, status = "Draft" } = req.body;

      const { rows } = await pool.query(
        "INSERT INTO loads (tenant_id, broker_id, rate, mileage, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [req.user.tenant_id, brokerId, rate, mileage, status],
      );

      return reply
        .code(HTTP_STATUS.CREATED)
        .send(new ApiResponse({ success: true, data: rows[0] }));
    },
  );
}
