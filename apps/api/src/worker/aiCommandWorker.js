const { Worker } = require("bullmq");
const config = require("../config");
const { prisma, getPrisma } = require("../db/prisma");
const { getTool, listTools } = require("../ai/tools/registry");
const { planFromCommand } = require("../services/aiPlanner");

function getRedisConnectionOptions() {
  const host = config.REDIS_HOST || process.env.REDIS_HOST || "127.0.0.1";
  const port = Number(config.REDIS_PORT || process.env.REDIS_PORT || 6379);
  const password = config.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined;
  return { host, port, password };
}

async function recordToolCall(prismaClient, aiCommandId, tool) {
  return prismaClient.aiCommandToolCall.create({
    data: {
      aiCommandId,
      name: tool.name,
      arguments: tool.arguments || {},
      status: "proposed",
    },
  });
}

async function executeToolCall(ctx, toolCallRow) {
  const toolName = toolCallRow.name;
  const toolFn = getTool(toolName);

  if (!toolFn) {
    throw new Error(`Tool not allowed: ${toolName}. Allowed: ${listTools().join(", ")}`);
  }

  // Mark executing (best-effort via status field)
  await ctx.prisma.aiCommandToolCall.update({
    where: { id: toolCallRow.id },
    data: { status: "executing" },
  });

  try {
    const result = await toolFn(ctx, toolCallRow.arguments || {});
    await ctx.prisma.aiCommandToolCall.update({
      where: { id: toolCallRow.id },
      data: { status: "executed", result },
    });
    return { ok: true, tool: toolName, result };
  } catch (err) {
    await ctx.prisma.aiCommandToolCall.update({
      where: { id: toolCallRow.id },
      data: { status: "failed", error: err?.message || "tool failed" },
    });
    return { ok: false, tool: toolName, error: err?.message || "tool failed" };
  }
}

async function executeAiCommand({ aiCommandId }) {
  const client = getPrisma?.() || prisma;
  if (!client) throw new Error("Database not initialized");

  const cmd = await client.aiCommand.findUnique({
    where: { id: aiCommandId },
    include: { toolCalls: true },
  });
  if (!cmd) throw new Error("AiCommand not found");

  // Build plan if we don't already have one
  let proposedPlan = cmd.proposedPlan;
  if (!proposedPlan) {
    proposedPlan = planFromCommand(cmd.command);
    await client.aiCommand.update({
      where: { id: aiCommandId },
      data: { proposedPlan },
    });
  }

  // Create tool call ledger rows if none exist yet
  if (!cmd.toolCalls || cmd.toolCalls.length === 0) {
    const tools = Array.isArray(proposedPlan?.tools) ? proposedPlan.tools : [];
    for (const t of tools) {
      await recordToolCall(client, aiCommandId, t);
    }
  }

  // Refresh with toolCalls
  const cmd2 = await client.aiCommand.findUnique({
    where: { id: aiCommandId },
    include: { toolCalls: true },
  });

  await client.aiCommand.update({
    where: { id: aiCommandId },
    data: { status: "EXECUTING" },
  });

  const ctx = {
    prisma: client,
    actor: {
      userId: cmd2.userId,
      organizationId: cmd2.organizationId,
    },
  };

  const results = [];
  for (const tc of cmd2.toolCalls) {
    // Only execute proposed/executing-safe statuses
    if (tc.status && !["proposed", "executing"].includes(String(tc.status))) continue;
    results.push(await executeToolCall(ctx, tc));
  }

  const ok = results.every((r) => r.ok);

  await client.aiCommand.update({
    where: { id: aiCommandId },
    data: {
      status: ok ? "SUCCEEDED" : "FAILED",
      executedAt: new Date(),
      executedPlan: proposedPlan,
      result: { results },
      error: ok ? null : "One or more tool calls failed",
    },
  });

  return { ok, results };
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
    } catch (_) {}
  });

  return worker;
}

const aiCommandWorker = startAiCommandWorker();

module.exports = { startAiCommandWorker, aiCommandWorker };
