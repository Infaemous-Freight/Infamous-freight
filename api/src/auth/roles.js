// Lightweight RBAC role and permission mapping

/** @type {('SHIPPER'|'DRIVER'|'ADMIN'|'SYSTEM')} */
// Exported as JSDoc for IDE support

const rolePermissions = {
    SHIPPER: ["job:create", "job:view", "job:cancel"],
    DRIVER: ["job:view", "job:accept", "job:pickup", "job:deliver", "offer:accept"],
    ADMIN: [
        "job:create",
        "job:view",
        "job:cancel",
        "job:accept",
        "job:pickup",
        "job:deliver",
        "offer:fanout",
        "offer:accept",
        "payout:run",
        "admin:ops",
    ],
    SYSTEM: ["offer:fanout", "payout:run"],
};

function hasPerm(role, perm) {
    return Array.isArray(rolePermissions[role]) && rolePermissions[role].includes(perm);
}

module.exports = {
    rolePermissions,
    hasPerm,
};
