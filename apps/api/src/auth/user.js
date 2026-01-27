const { verifyToken } = require("./jwt");

/**
 * Unified user identity extractor.
 * Priority: req.user.sub (from authenticate) -> Bearer token -> x-user-id header -> null.
 */
function getUserId(req) {
    if (req?.user?.sub) return String(req.user.sub);

    const auth = req?.headers?.authorization || req?.headers?.Authorization;
    if (auth && typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
        const token = auth.slice(7).trim();
        const claims = verifyToken(token);
        if (claims?.sub) return String(claims.sub);
    }

    const headerId = req?.headers?.["x-user-id"];
    if (headerId) return String(headerId);

    return null;
}

module.exports = {
    getUserId,
};
