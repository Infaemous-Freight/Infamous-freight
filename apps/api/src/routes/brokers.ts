import type { FastifyInstance } from "fastify";
import { pool } from "../lib/db";

export default async function brokerRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async (req: any) => {
    const { rows } = await pool.query(
      "SELECT * FROM brokers WHERE tenant_id = $1 ORDER BY company_name ASC",
      [req.user.tenant_id],
    );
    return rows;
  });

  app.post("/", { preHandler: [app.authenticate] }, async (req: any, reply) => {
    const { companyName, mcNumber, creditScore = 70 } = req.body;

    const { rows } = await pool.query(
      "INSERT INTO brokers (tenant_id, company_name, mc_number, credit_score) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user.tenant_id, companyName, mcNumber, creditScore],
    );

    reply.code(201).send(rows[0]);
  });
}
