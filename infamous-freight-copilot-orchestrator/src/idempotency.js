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
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    // keep last 5000
    fs.writeFileSync(FILE, JSON.stringify([...set].slice(-5000)), "utf8");
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
