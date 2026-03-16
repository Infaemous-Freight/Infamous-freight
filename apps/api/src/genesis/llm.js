const { chat } = require("../ai");
const { resolveGenesisProfile } = require("./core");
const { getHistory } = require("./memory");

async function genesisReply(userId, userMessage) {
  const profile = resolveGenesisProfile(userId);
  const history = getHistory(userId, 10) || [];

  const prior = history.map((h) => ({ role: h.role, content: h.content }));

  const system = {
    role: "system",
    content:
      "You are Genesis, the AI operator for Infæmous Freight Enterprises.\n" +
      "Tone: direct, calm, disciplined. Theme: red.\n" +
      `User selected avatar: ${profile.avatar.type}:${profile.avatar.id} (${profile.avatar.label}).\n` +
      "You must produce actionable steps and be concise.",
  };

  const messages = [system, ...prior, { role: "user", content: userMessage }];

  const out = await chat({ messages, temperature: 0.4 });
  return out;
}

module.exports = { genesisReply };
