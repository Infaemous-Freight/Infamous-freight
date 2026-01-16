// JWT validator with JWKS (rotation-ready, optional)
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const jwksUri = process.env.AUTH_JWKS_URI || null;
const audience = process.env.AUTH_AUDIENCE || null;
const issuer = process.env.AUTH_ISSUER || null;

const client = jwksUri
    ? jwksClient({
        jwksUri,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 10 * 60 * 1000,
    })
    : null;

function getKey(header, callback) {
    if (!client) return callback(new Error("JWKS not configured"));
    client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key?.getPublicKey?.() || key?.publicKey || key?.rsaPublicKey;
        callback(err, signingKey);
    });
}

function authMiddleware() {
    return (req, res, next) => {
        // If JWKS not configured, pass through
        if (!client) return next();

        const authz = req.headers["authorization"] || req.headers["Authorization"] || "";
        const token = typeof authz === "string" && authz.startsWith("Bearer ") ? authz.slice(7) : null;

        // Allow public endpoints and legacy auth to function when token missing
        if (!token) return next();

        const verifyOpts = {
            audience: audience || undefined,
            issuer: issuer || undefined,
            algorithms: ["RS256"],
            clockTolerance: 5,
        };

        jwt.verify(token, getKey, verifyOpts, (err, decoded) => {
            if (err) return res.status(401).json({ error: "Invalid token" });

            const d = decoded || {};
            req.auth = {
                userId: d.sub,
                role: d.role || d["https://roles"] || "SHIPPER",
                email: d.email,
            };
            next();
        });
    };
}

module.exports = { authMiddleware };
