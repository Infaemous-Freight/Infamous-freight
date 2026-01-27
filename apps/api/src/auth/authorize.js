// Authorization middleware using RBAC permissions
const { hasPerm } = require("./roles");

function getRoleFromReq(req) {
    // Prefer JWT-derived auth context, fallback to existing req.user
    const role = req.auth?.role || req.user?.role;
    return typeof role === "string" ? role.toUpperCase() : undefined;
}

function requirePerm(perm) {
    return (req, res, next) => {
        const role = getRoleFromReq(req);
        if (!role) return res.status(401).json({ error: "Unauthorized" });
        if (!hasPerm(role, perm)) return res.status(403).json({ error: "Forbidden", perm });
        next();
    };
}

module.exports = { requirePerm };
