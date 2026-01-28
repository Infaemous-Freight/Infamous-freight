export async function deliberateDelay(minMs = 320, maxMs = 620) {
  const ms = Math.floor(minMs + Math.random() * (maxMs - minMs));
  await new Promise((r) => setTimeout(r, ms));
  return ms;
}
