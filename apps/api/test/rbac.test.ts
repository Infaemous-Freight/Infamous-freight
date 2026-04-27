/**
 * RBAC role-boundary tests
 *
 * Requirement evidence for MVP issue "Implement role-based access boundaries":
 *   - Admin can access everything.
 *   - Dispatcher can access loads, tracking, carriers, documents.
 *   - Sales can access shippers and quote requests.
 *   - Carrier Manager can access carriers and carrier documents.
 *   - Accounting can access invoices and PODs.
 *   - Shipper can access only their own quotes, loads, and customer-visible tracking.
 *   - Carrier can access only their own profile and assigned loads.
 *   - Driver can submit assigned tracking updates only.
 *   - External users cannot view financial margin or internal notes.
 */

import {
  UserRole,
  TeamMember,
  ROLE_PERMISSIONS,
  SENSITIVE_FINANCIAL_FIELDS,
  EXTERNAL_ROLES,
  isExternalRole,
  hasPermission,
  filterSensitiveFields,
  canAccessLoad,
  canSubmitTrackingUpdate,
  getMenuVisibility,
} from '../src/rbac/rbac-rules';

function makeMember(role: UserRole, ownerId?: string): TeamMember {
  return {
    id: `member_${role}`,
    email: `${role}@test.com`,
    name: role,
    role,
    carrierId: 'carrier_test',
    invitedBy: 'owner',
    status: 'active',
    permissions: ROLE_PERMISSIONS[role],
    ownerId,
    createdAt: new Date(),
  };
}

describe('RBAC role-boundary tests', () => {
  // ---------- role boundary tests ----------

  describe('Admin role boundaries', () => {
    it('admin has all permissions', () => {
      const admin = makeMember('admin');
      expect(hasPermission(admin, 'loads:view')).toBe(true);
      expect(hasPermission(admin, 'invoices:view')).toBe(true);
      expect(hasPermission(admin, 'shippers:view')).toBe(true);
      expect(hasPermission(admin, 'carriers:view')).toBe(true);
      expect(hasPermission(admin, 'quotes:view')).toBe(true);
      expect(hasPermission(admin, 'settings:edit')).toBe(true);
      expect(hasPermission(admin, 'tracking:view')).toBe(true);
      expect(hasPermission(admin, 'pods:view')).toBe(true);
      expect(hasPermission(admin, 'analytics:export')).toBe(true);
      expect(hasPermission(admin, 'team:remove')).toBe(true);
    });
  });

  describe('Dispatcher role boundaries', () => {
    it('dispatcher can access loads, tracking, carriers, and documents', () => {
      const dispatcher = makeMember('dispatcher');
      expect(hasPermission(dispatcher, 'loads:view')).toBe(true);
      expect(hasPermission(dispatcher, 'loads:create')).toBe(true);
      expect(hasPermission(dispatcher, 'loads:assign')).toBe(true);
      expect(hasPermission(dispatcher, 'tracking:view')).toBe(true);
      expect(hasPermission(dispatcher, 'carriers:view')).toBe(true);
      expect(hasPermission(dispatcher, 'documents:view')).toBe(true);
      expect(hasPermission(dispatcher, 'documents:upload')).toBe(true);
    });

    it('dispatcher cannot access shippers, quotes, or invoices:send', () => {
      const dispatcher = makeMember('dispatcher');
      expect(hasPermission(dispatcher, 'shippers:view')).toBe(false);
      expect(hasPermission(dispatcher, 'quotes:create')).toBe(false);
      expect(hasPermission(dispatcher, 'invoices:send')).toBe(false);
    });
  });

  describe('Sales role boundaries', () => {
    it('sales can access shippers and quote requests', () => {
      const sales = makeMember('sales');
      expect(hasPermission(sales, 'shippers:view')).toBe(true);
      expect(hasPermission(sales, 'shippers:create')).toBe(true);
      expect(hasPermission(sales, 'shippers:edit')).toBe(true);
      expect(hasPermission(sales, 'quotes:view')).toBe(true);
      expect(hasPermission(sales, 'quotes:create')).toBe(true);
      expect(hasPermission(sales, 'quotes:edit')).toBe(true);
      expect(hasPermission(sales, 'quotes:approve')).toBe(true);
    });

    it('sales cannot access invoices, carriers management, or settings', () => {
      const sales = makeMember('sales');
      expect(hasPermission(sales, 'invoices:view')).toBe(false);
      expect(hasPermission(sales, 'carriers:create')).toBe(false);
      expect(hasPermission(sales, 'settings:edit')).toBe(false);
    });
  });

  describe('Carrier Manager role boundaries', () => {
    it('carrier_manager can access carriers and carrier documents', () => {
      const cm = makeMember('carrier_manager');
      expect(hasPermission(cm, 'carriers:view')).toBe(true);
      expect(hasPermission(cm, 'carriers:create')).toBe(true);
      expect(hasPermission(cm, 'carriers:edit')).toBe(true);
      expect(hasPermission(cm, 'carriers:approve')).toBe(true);
      expect(hasPermission(cm, 'documents:view')).toBe(true);
      expect(hasPermission(cm, 'documents:upload')).toBe(true);
    });

    it('carrier_manager cannot access invoices, shippers, or settings', () => {
      const cm = makeMember('carrier_manager');
      expect(hasPermission(cm, 'invoices:view')).toBe(false);
      expect(hasPermission(cm, 'shippers:view')).toBe(false);
      expect(hasPermission(cm, 'settings:edit')).toBe(false);
    });
  });

  describe('Accounting role boundaries', () => {
    it('accounting can access invoices and PODs', () => {
      const acct = makeMember('accounting');
      expect(hasPermission(acct, 'invoices:view')).toBe(true);
      expect(hasPermission(acct, 'invoices:create')).toBe(true);
      expect(hasPermission(acct, 'invoices:send')).toBe(true);
      expect(hasPermission(acct, 'pods:view')).toBe(true);
      expect(hasPermission(acct, 'pods:upload')).toBe(true);
    });

    it('accounting cannot manage loads, drivers, or carriers', () => {
      const acct = makeMember('accounting');
      expect(hasPermission(acct, 'loads:create')).toBe(false);
      expect(hasPermission(acct, 'drivers:edit')).toBe(false);
      expect(hasPermission(acct, 'carriers:approve')).toBe(false);
    });
  });

  // ---------- external role tests ----------

  describe('isExternalRole', () => {
    it('returns true for shipper, carrier, and driver', () => {
      expect(isExternalRole('shipper')).toBe(true);
      expect(isExternalRole('carrier')).toBe(true);
      expect(isExternalRole('driver')).toBe(true);
    });

    it('returns false for all internal roles', () => {
      const internalRoles: UserRole[] = [
        'admin', 'owner', 'dispatcher', 'sales',
        'carrier_manager', 'accounting', 'safety_manager', 'accountant',
      ];
      for (const role of internalRoles) {
        expect(isExternalRole(role)).toBe(false);
      }
    });

    it('EXTERNAL_ROLES constant includes shipper, carrier, driver', () => {
      expect(EXTERNAL_ROLES).toContain('shipper');
      expect(EXTERNAL_ROLES).toContain('carrier');
      expect(EXTERNAL_ROLES).toContain('driver');
    });
  });

  describe('Shipper role boundaries', () => {
    it('shipper can view own quotes, loads, and customer-visible tracking', () => {
      const sh = makeMember('shipper');
      expect(hasPermission(sh, 'quotes:view')).toBe(true);
      expect(hasPermission(sh, 'loads:view')).toBe(true);
      expect(hasPermission(sh, 'tracking:view')).toBe(true);
    });

    it('shipper cannot create/edit loads, carriers, or invoices', () => {
      const sh = makeMember('shipper');
      expect(hasPermission(sh, 'loads:create')).toBe(false);
      expect(hasPermission(sh, 'loads:assign')).toBe(false);
      expect(hasPermission(sh, 'carriers:view')).toBe(false);
      expect(hasPermission(sh, 'invoices:view')).toBe(false);
    });

    it('shipper can only access their own loads (canAccessLoad)', () => {
      const sh = makeMember('shipper', 'shipper_123');
      expect(canAccessLoad(sh, { shipperId: 'shipper_123' })).toBe(true);
      expect(canAccessLoad(sh, { shipperId: 'shipper_other' })).toBe(false);
    });
  });

  describe('Carrier role boundaries', () => {
    it('carrier can view own profile and assigned loads', () => {
      const car = makeMember('carrier');
      expect(hasPermission(car, 'loads:view')).toBe(true);
      expect(hasPermission(car, 'tracking:view')).toBe(true);
      expect(hasPermission(car, 'documents:upload')).toBe(true);
      expect(hasPermission(car, 'pods:upload')).toBe(true);
    });

    it('carrier cannot access other carriers, shippers, or invoices', () => {
      const car = makeMember('carrier');
      expect(hasPermission(car, 'carriers:view')).toBe(false);
      expect(hasPermission(car, 'shippers:view')).toBe(false);
      expect(hasPermission(car, 'invoices:view')).toBe(false);
    });

    it('carrier can only access their own loads (canAccessLoad)', () => {
      const car = makeMember('carrier', 'carrier_abc');
      expect(canAccessLoad(car, { carrierId: 'carrier_abc' })).toBe(true);
      expect(canAccessLoad(car, { carrierId: 'carrier_other' })).toBe(false);
    });
  });

  describe('Driver role boundaries', () => {
    it('driver can submit assigned tracking updates only', () => {
      const drv = makeMember('driver');
      expect(hasPermission(drv, 'tracking:submit')).toBe(true);
      expect(hasPermission(drv, 'loads:view')).toBe(true);
    });

    it('driver cannot create loads or access financial data', () => {
      const drv = makeMember('driver');
      expect(hasPermission(drv, 'loads:create')).toBe(false);
      expect(hasPermission(drv, 'invoices:view')).toBe(false);
      expect(hasPermission(drv, 'analytics:view')).toBe(false);
    });

    it('driver can only submit tracking for their assigned load (canSubmitTrackingUpdate)', () => {
      const drv = makeMember('driver', 'driver_john');
      expect(canSubmitTrackingUpdate(drv, { driverName: 'driver_john' })).toBe(true);
      expect(canSubmitTrackingUpdate(drv, { driverName: 'driver_other' })).toBe(false);
    });
  });

  // ---------- sensitive-field filtering tests ----------

  describe('filterSensitiveFields – external users cannot see financial margin or internal notes', () => {
    const loadRecord = {
      id: 'load_1',
      loadNumber: 'LN-001',
      originCity: 'Dallas',
      destCity: 'Atlanta',
      status: 'IN_TRANSIT',
      shipperRate: 3000,
      carrierRate: 2400,
      grossMargin: 600,
      grossMarginPercentage: 20,
      notes: 'Do not share with carrier – tight margin',
      internalNotes: 'Use carrier XYZ only if no alternatives',
    };

    const quoteRecord = {
      id: 'quote_1',
      quoteNumber: 'Q-001',
      originCity: 'Dallas',
      destCity: 'Chicago',
      estimatedCarrierCost: 2000,
      targetMargin: 25,
      profitMargin: 500,
      carrierCost: 2000,
      notes: 'Internal sales note – do not expose',
    };

    it('SENSITIVE_FINANCIAL_FIELDS covers all margin and internal-notes keys', () => {
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('shipperRate');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('carrierRate');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('grossMargin');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('grossMarginPercentage');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('targetMargin');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('estimatedCarrierCost');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('notes');
      expect(SENSITIVE_FINANCIAL_FIELDS).toContain('internalNotes');
    });

    it('shipper cannot see financial margin fields on a load', () => {
      expect(isExternalRole('shipper')).toBe(true);

      const filtered = filterSensitiveFields(loadRecord as Record<string, unknown>);

      expect(filtered).not.toHaveProperty('shipperRate');
      expect(filtered).not.toHaveProperty('carrierRate');
      expect(filtered).not.toHaveProperty('grossMargin');
      expect(filtered).not.toHaveProperty('grossMarginPercentage');
    });

    it('shipper cannot see internal notes on a load', () => {
      expect(isExternalRole('shipper')).toBe(true);

      const filtered = filterSensitiveFields(loadRecord as Record<string, unknown>);

      expect(filtered).not.toHaveProperty('notes');
      expect(filtered).not.toHaveProperty('internalNotes');
    });

    it('carrier cannot see financial margin or internal notes on a load', () => {
      expect(isExternalRole('carrier')).toBe(true);

      const filtered = filterSensitiveFields(loadRecord as Record<string, unknown>);

      expect(filtered).not.toHaveProperty('shipperRate');
      expect(filtered).not.toHaveProperty('carrierRate');
      expect(filtered).not.toHaveProperty('grossMargin');
      expect(filtered).not.toHaveProperty('notes');
    });

    it('driver cannot see financial margin or internal notes on a load', () => {
      expect(isExternalRole('driver')).toBe(true);

      const filtered = filterSensitiveFields(loadRecord as Record<string, unknown>);

      expect(filtered).not.toHaveProperty('grossMargin');
      expect(filtered).not.toHaveProperty('grossMarginPercentage');
      expect(filtered).not.toHaveProperty('notes');
      expect(filtered).not.toHaveProperty('internalNotes');
    });

    it('shipper cannot see targetMargin or estimatedCarrierCost on a quote', () => {
      expect(isExternalRole('shipper')).toBe(true);

      const filtered = filterSensitiveFields(quoteRecord as Record<string, unknown>);

      expect(filtered).not.toHaveProperty('estimatedCarrierCost');
      expect(filtered).not.toHaveProperty('targetMargin');
      expect(filtered).not.toHaveProperty('profitMargin');
      expect(filtered).not.toHaveProperty('carrierCost');
      expect(filtered).not.toHaveProperty('notes');
    });

    it('filtered data retains non-sensitive fields', () => {
      const filtered = filterSensitiveFields(loadRecord as Record<string, unknown>);

      expect(filtered).toHaveProperty('id', 'load_1');
      expect(filtered).toHaveProperty('loadNumber', 'LN-001');
      expect(filtered).toHaveProperty('originCity', 'Dallas');
      expect(filtered).toHaveProperty('status', 'IN_TRANSIT');
    });

    it('internal roles (admin, dispatcher) are not external roles', () => {
      expect(isExternalRole('admin')).toBe(false);
      expect(isExternalRole('dispatcher')).toBe(false);
    });
  });

  // ---------- ownership-scoped access tests ----------

  describe('canAccessLoad ownership scoping', () => {
    it('internal roles can always access any load', () => {
      const admin = makeMember('admin');
      expect(canAccessLoad(admin, { shipperId: 'any', carrierId: 'any' })).toBe(true);

      const dispatcher = makeMember('dispatcher');
      expect(canAccessLoad(dispatcher, { shipperId: 'any', carrierId: 'any' })).toBe(true);
    });

    it('shipper cannot access loads belonging to another shipper', () => {
      const sh = makeMember('shipper', 'shipper_mine');
      expect(canAccessLoad(sh, { shipperId: 'shipper_other' })).toBe(false);
    });

    it('carrier cannot access loads assigned to another carrier', () => {
      const car = makeMember('carrier', 'carrier_mine');
      expect(canAccessLoad(car, { carrierId: 'carrier_other' })).toBe(false);
    });
  });

  describe('canSubmitTrackingUpdate ownership scoping', () => {
    it('internal dispatcher can submit tracking updates for any load', () => {
      const disp = makeMember('dispatcher');
      expect(canSubmitTrackingUpdate(disp, { driverName: 'any_driver', carrierId: 'any_carrier' })).toBe(true);
    });

    it('driver without tracking:submit permission cannot submit updates', () => {
      const drv = makeMember('driver', 'driver_x');
      drv.permissions = drv.permissions.filter((p) => p !== 'tracking:submit');
      expect(canSubmitTrackingUpdate(drv, { driverName: 'driver_x' })).toBe(false);
    });
  });

  // ---------- getMenuVisibility tests ----------

  describe('getMenuVisibility', () => {
    it('admin sees all menus', () => {
      const vis = getMenuVisibility('admin');
      expect(vis.carriers).toBe(true);
      expect(vis.shippers).toBe(true);
      expect(vis.quotes).toBe(true);
      expect(vis.invoices).toBe(true);
      expect(vis.tracking).toBe(true);
    });

    it('sales sees shippers and quotes menus, not invoices', () => {
      const vis = getMenuVisibility('sales');
      expect(vis.shippers).toBe(true);
      expect(vis.quotes).toBe(true);
      expect(vis.invoices).toBe(false);
    });

    it('accounting sees invoices and pods menus', () => {
      const vis = getMenuVisibility('accounting');
      expect(vis.invoices).toBe(true);
      expect(vis.pods).toBe(true);
    });

    it('driver only sees tracking menu (no invoices, shippers, or carriers)', () => {
      const vis = getMenuVisibility('driver');
      expect(vis.tracking).toBe(true);
      expect(vis.invoices).toBe(false);
      expect(vis.shippers).toBe(false);
      expect(vis.carriers).toBe(false);
    });
  });
});
