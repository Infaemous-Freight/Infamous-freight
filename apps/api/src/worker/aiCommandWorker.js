const { Worker } = require("bullmq");
const config = require("../config");
const { prisma, getPrisma } = require("../db/prisma");

function getRedisConnectionOptions() {
  const host = config.REDIS_HOST || process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(config.REDIS_PORT || process.env.REDIS_PORT || 6379);
  const password = config.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
}

async function executeAiCommand({ aiCommandId }) {
  const client = getPrisma?.() || prisma;
  if (!client) throw new Error("Database not initialized");

  const cmd = await client.aiCommand.findUnique({
    where: { id: aiCommandId },
    include: { toolCalls: true },
  });
  if (!cmd) throw new Error("AiCommand not found");

  await client.aiCommand.update({
    where: { id: aiCommandId },
    data: { status: "EXECUTING" },
  });

  const proposed = {
    tools: [{ name: "noop", arguments: { message: "Simulated execution stub" } }],
  };

  await client.aiCommand.update({ where: { id: aiCommandId }, data: { proposedPlan: proposed } });

  const tc = await client.aiCommandToolCall.create({
    data: {
      aiCommandId,
      name: "noop",
      arguments: { message: "Simulated execution stub" },
      status: "executed",
      result: { ok: true },
    },
  });

  const result = {
    ok: true,
    message: "AI command executed (stub). Replace noop with real tools.",
    toolCallId: tc.id,
  };

  await client.aiCommand.update({
    where: { id: aiCommandId },
    data: {
      status: "SUCCEEDED",
      executedAt: new Date(),
      executedPlan: proposed,
      result,
    },
  });

  return result;
}

function startAiCommandWorker() {
  const worker = new Worker(
    "ai-commands",
    async (job) => {
      const { aiCommandId } = job.data || {};
      if (!aiCommandId) throw new Error("Missing aiCommandId");
      return executeAiCommand({ aiCommandId });
    },
    { connection: getRedisConnectionOptions() },
  );

  worker.on("failed", async (job, err) => {
    try {
      const client = getPrisma?.() || prisma;
      const aiCommandId = job?.data?.aiCommandId;
      if (client && aiCommandId) {
        await client.aiCommand.update({
          where: { id: aiCommandId },
          data: { status: "FAILED", error: err?.message || "unknown error" },
        });
      }
    } catch (_error) {
      // fail open
    }
  });

  return worker;
}

module.exports = { startAiCommandWorker };
