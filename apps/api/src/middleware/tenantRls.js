/**
 * Middleware to set Postgres app.current_tenant for RLS-backed tables.
 * Expects req.user.tenant_id and req.db.query(sql, values).
 */

async function setCurrentTenant(req, _res, next) {
  try {
    const tenantId = req.user?.tenant_id || req.user?.organizationId;
    if (tenantId && req.db && typeof req.db.query === "function") {
      await req.db.query("SET app.current_tenant = $1", [tenantId]);
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  setCurrentTenant,
};
