const { getPrisma } = require("../db/prisma");
const mem = require("./memory");

async function getHistory(userId, limit = 12) {
  const p = getPrisma();
  if (!p) return mem.getHistory(userId, limit);

  const rows = await p.genesisMessage.findMany({
    where: { userId },
    orderBy: { ts: "desc" },
    take: limit,
  });

  return rows.reverse().map((r) => ({
    role: r.role,
    content: r.content,
    ts: r.ts.getTime(),
  }));
}

async function addMessage(userId, role, content) {
  const p = getPrisma();
  if (!p) return mem.addMessage(userId, role, content);

  await p.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  await p.genesisMessage.create({
    data: {
      id: `gm_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      userId,
      role,
      content,
    },
  });
}

module.exports = { getHistory, addMessage };
