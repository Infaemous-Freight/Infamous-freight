ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Truck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Carrier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Load" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RoutePlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GpsPing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Anomaly" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_org_isolation ON "User"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY driver_org_isolation ON "Driver"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY truck_org_isolation ON "Truck"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY carrier_org_isolation ON "Carrier"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY load_org_isolation ON "Load"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY route_org_isolation ON "RoutePlan"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY gps_org_isolation ON "GpsPing"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY anomaly_org_isolation ON "Anomaly"
USING ("organizationId" = current_setting('app.current_organization_id', true));

CREATE POLICY audit_org_isolation ON "AuditLog"
USING ("organizationId" = current_setting('app.current_organization_id', true));
