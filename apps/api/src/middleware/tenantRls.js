/**
 * Middleware to set Postgres app.current_tenant for RLS-backed tables.
 * Expects req.user.tenant_id or req.user.organizationId.
 */

const prisma = require("../db/prisma");

async function setCurrentTenant(req, _res, next) {
  try {
    const tenantId =
      req.user?.tenant_id ||
      req.auth?.organizationId ||
      req.user?.org_id;
    if (tenantId) {
      await prisma.$executeRaw`SET app.current_tenant = ${tenantId}`;
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  setCurrentTenant,
};
