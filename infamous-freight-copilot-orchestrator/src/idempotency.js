import fs from "fs";
import path from "path";

const FILE = process.env.IDEMPOTENCY_FILE || "/tmp/deliveries.json";

function load() {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function save(set) {
  try {
    // Ensure the in-memory set does not grow unbounded: keep only the last 5000 entries.
    const recent = [...set].slice(-5000);
    if (set.size > recent.length) {
      set.clear();
      for (const id of recent) {
        set.add(id);
      }
    }

    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(recent), "utf8");
  } catch {
    // ignore
  }
}

const deliveries = load();

export function seenDelivery(deliveryId) {
  return deliveries.has(deliveryId);
}

export function markDelivery(deliveryId) {
  deliveries.add(deliveryId);
  save(deliveries);
}
