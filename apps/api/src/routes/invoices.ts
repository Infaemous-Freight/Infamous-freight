import type { FastifyInstance } from "fastify";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { pool } from "../lib/db";

const connection = new IORedis(process.env.REDIS_URL);
const invoiceQueue = new Queue("invoiceQueue", { connection });

export default async function invoiceRoutes(app: FastifyInstance) {
  app.post("/generate/:loadId", { preHandler: [app.authenticate] }, async (req: any, reply) => {
    const { loadId } = req.params;

    const loadResult = await pool.query("SELECT rate FROM loads WHERE id = $1 AND tenant_id = $2", [
      loadId,
      req.user.tenant_id,
    ]);

    const load = loadResult.rows[0];
    if (!load) {
      return reply.code(404).send({ error: "Load not found" });
    }

    const invoice = await pool.query(
      "INSERT INTO invoices (tenant_id, load_id, amount) VALUES ($1, $2, $3) RETURNING id",
      [req.user.tenant_id, loadId, load.rate],
    );

    await invoiceQueue.add("generate", { invoiceId: invoice.rows[0].id });

    return { success: true, invoiceId: invoice.rows[0].id };
  });
}
