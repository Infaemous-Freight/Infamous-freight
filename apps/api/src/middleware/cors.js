const cors = require("cors");

// Build allowlist from CORS_ORIGINS env (comma-separated)
function getAllowedOrigins() {
    const raw = process.env.CORS_ORIGINS || "http://localhost:3000";
    return raw
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
}

function corsMiddleware() {
    const allowed = getAllowedOrigins();
    const allowedSet = new Set(allowed);

    return cors({
        origin: (origin, callback) => {
            // Allow server-to-server (no Origin header)
            if (!origin) return callback(null, true);
            if (allowedSet.has(origin)) return callback(null, true);
            return callback(new Error("CORS blocked"), false);
        },
        credentials: true,
    });
}

module.exports = {
    corsMiddleware,
    getAllowedOrigins,
};