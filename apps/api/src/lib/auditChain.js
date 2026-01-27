// Tamper-evident append-only audit log with hash chaining
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LOG_DIR = process.env.AUDIT_LOG_DIR || path.join(__dirname, "../../data");
const LOG_FILE = process.env.AUDIT_LOG_FILE || path.join(LOG_DIR, "audit.log");
const SALT = process.env.AUDIT_LOG_SALT || "audit-salt";

let prevHash = null;

function ensureDir() {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch (_) { }
}

function computeHash(prev, payload) {
    const h = crypto.createHash("sha256");
    h.update(String(prev || ""));
    h.update(JSON.stringify(payload));
    h.update(SALT);
    return h.digest("hex");
}

function append(event) {
    try {
        ensureDir();
        const entry = {
            ts: new Date().toISOString(),
            event,
            prevHash,
        };
        const hash = computeHash(prevHash, entry);
        entry.hash = hash;
        const line = JSON.stringify(entry) + "\n";
        fs.appendFileSync(LOG_FILE, line, { encoding: "utf8" });
        prevHash = hash;
    } catch (_) {
        // Fail open; do not throw from auditing
    }
}

module.exports = { append };
