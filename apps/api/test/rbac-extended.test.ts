import {
  UserRole,
  TeamMember,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  canAccessLoad,
  canSubmitTrackingUpdate,
  getMenuVisibility,
  isExternalRole,
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

describe('Owner role boundaries', () => {
  it('owner has all permissions (same as admin)', () => {
    const owner = makeMember('owner');
    const admin = makeMember('admin');

    expect(owner.permissions).toEqual(admin.permissions);
    expect(hasPermission(owner, 'loads:view')).toBe(true);
    expect(hasPermission(owner, 'invoices:view')).toBe(true);
    expect(hasPermission(owner, 'settings:edit')).toBe(true);
    expect(hasPermission(owner, 'team:remove')).toBe(true);
    expect(hasPermission(owner, 'analytics:export')).toBe(true);
    expect(hasPermission(owner, 'carriers:approve')).toBe(true);
    expect(hasPermission(owner, 'shippers:create')).toBe(true);
  });

  it('owner sees all menus', () => {
    const vis = getMenuVisibility('owner');
    expect(vis.carriers).toBe(true);
    expect(vis.shippers).toBe(true);
    expect(vis.quotes).toBe(true);
    expect(vis.invoices).toBe(true);
    expect(vis.tracking).toBe(true);
    expect(vis.settings).toBe(true);
    expect(vis.team).toBe(true);
  });
});

describe('Safety manager role boundaries', () => {
  it('safety_manager can access safety, drivers, documents, and ELD', () => {
    const sm = makeMember('safety_manager');
    expect(hasPermission(sm, 'safety:view')).toBe(true);
    expect(hasPermission(sm, 'safety:hos')).toBe(true);
    expect(hasPermission(sm, 'safety:violations')).toBe(true);
    expect(hasPermission(sm, 'drivers:view')).toBe(true);
    expect(hasPermission(sm, 'drivers:edit')).toBe(true);
    expect(hasPermission(sm, 'documents:view')).toBe(true);
    expect(hasPermission(sm, 'documents:upload')).toBe(true);
    expect(hasPermission(sm, 'eld:view')).toBe(true);
    expect(hasPermission(sm, 'analytics:view')).toBe(true);
  });

  it('safety_manager cannot access invoices, loads:create, or settings:edit', () => {
    const sm = makeMember('safety_manager');
    expect(hasPermission(sm, 'invoices:view')).toBe(false);
    expect(hasPermission(sm, 'loads:create')).toBe(false);
    expect(hasPermission(sm, 'settings:edit')).toBe(false);
    expect(hasPermission(sm, 'shippers:view')).toBe(false);
  });

  it('safety_manager sees safety and drivers menus but not invoices or shippers', () => {
    const vis = getMenuVisibility('safety_manager');
    expect(vis.safety).toBe(true);
    expect(vis.drivers).toBe(true);
    expect(vis.eld).toBe(true);
    expect(vis.invoices).toBe(false);
    expect(vis.shippers).toBe(false);
  });
});

describe('Accountant role boundaries', () => {
  it('accountant can access invoices and PODs', () => {
    const acct = makeMember('accountant');
    expect(hasPermission(acct, 'invoices:view')).toBe(true);
    expect(hasPermission(acct, 'invoices:create')).toBe(true);
    expect(hasPermission(acct, 'invoices:send')).toBe(true);
    expect(hasPermission(acct, 'pods:view')).toBe(true);
    expect(hasPermission(acct, 'analytics:view')).toBe(true);
    expect(hasPermission(acct, 'analytics:export')).toBe(true);
  });

  it('accountant cannot manage loads, drivers, or carriers', () => {
    const acct = makeMember('accountant');
    expect(hasPermission(acct, 'loads:create')).toBe(false);
    expect(hasPermission(acct, 'carriers:approve')).toBe(false);
    expect(hasPermission(acct, 'settings:edit')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when the member holds at least one of the given permissions', () => {
    const dispatcher = makeMember('dispatcher');
    expect(hasAnyPermission(dispatcher, ['loads:view', 'invoices:send'])).toBe(true);
  });

  it('returns false when the member holds none of the given permissions', () => {
    const dispatcher = makeMember('dispatcher');
    expect(hasAnyPermission(dispatcher, ['shippers:view', 'quotes:create'])).toBe(false);
  });

  it('returns false for an empty permissions array', () => {
    const admin = makeMember('admin');
    expect(hasAnyPermission(admin, [])).toBe(false);
  });
});

describe('getMenuVisibility for additional roles', () => {
  it('dispatcher sees loads, drivers, and tracking but not shippers or quotes', () => {
    const vis = getMenuVisibility('dispatcher');
    expect(vis.loads).toBe(true);
    expect(vis.drivers).toBe(true);
    expect(vis.tracking).toBe(true);
    expect(vis.shippers).toBe(false);
    expect(vis.quotes).toBe(false);
  });

  it('carrier_manager sees carriers and documents but not invoices or shippers', () => {
    const vis = getMenuVisibility('carrier_manager');
    expect(vis.carriers).toBe(true);
    expect(vis.documents).toBe(true);
    expect(vis.invoices).toBe(false);
    expect(vis.shippers).toBe(false);
  });

  it('shipper sees loads, tracking, and quotes but not carriers or invoices', () => {
    const vis = getMenuVisibility('shipper');
    expect(vis.loads).toBe(true);
    expect(vis.tracking).toBe(true);
    expect(vis.quotes).toBe(true);
    expect(vis.carriers).toBe(false);
    expect(vis.invoices).toBe(false);
  });

  it('carrier sees loads and tracking but not invoices or shippers', () => {
    const vis = getMenuVisibility('carrier');
    expect(vis.loads).toBe(true);
    expect(vis.tracking).toBe(true);
    expect(vis.invoices).toBe(false);
    expect(vis.shippers).toBe(false);
    expect(vis.carriers).toBe(false);
  });

  it('dashboard is always visible for every role', () => {
    const roles: UserRole[] = [
      'admin', 'owner', 'dispatcher', 'sales', 'carrier_manager',
      'accounting', 'safety_manager', 'accountant', 'shipper', 'carrier', 'driver',
    ];

    for (const role of roles) {
      expect(getMenuVisibility(role).dashboard).toBe(true);
    }
  });
});

describe('canAccessLoad for driver', () => {
  it('driver can access a load where driverName matches their ownerId', () => {
    const drv = makeMember('driver', 'driver_bob');
    expect(canAccessLoad(drv, { driverName: 'driver_bob' })).toBe(true);
  });

  it('driver cannot access a load belonging to a different driver', () => {
    const drv = makeMember('driver', 'driver_bob');
    expect(canAccessLoad(drv, { driverName: 'driver_alice' })).toBe(false);
  });

  it('driver without ownerId cannot access any load', () => {
    const drv = makeMember('driver');
    expect(canAccessLoad(drv, { driverName: 'driver_bob' })).toBe(false);
  });
});

describe('canSubmitTrackingUpdate for carrier', () => {
  it('carrier with tracking:submit can submit updates for their own carrierId', () => {
    // carriers don't have tracking:submit in ROLE_PERMISSIONS, but test the logic
    const car = makeMember('carrier', 'carrier_xyz');
    // carrier role doesn't include tracking:submit – confirm that
    expect(hasPermission(car, 'tracking:submit')).toBe(false);
    expect(canSubmitTrackingUpdate(car, { carrierId: 'carrier_xyz' })).toBe(false);
  });

  it('carrier with tracking:submit permission can only submit for their own carrierId', () => {
    const car = makeMember('carrier', 'carrier_xyz');
    // Inject tracking:submit to test the ownership guard
    car.permissions = [...car.permissions, 'tracking:submit'];

    expect(canSubmitTrackingUpdate(car, { carrierId: 'carrier_xyz' })).toBe(true);
    expect(canSubmitTrackingUpdate(car, { carrierId: 'carrier_other' })).toBe(false);
  });
});

describe('isExternalRole edge cases', () => {
  it('returns false for safety_manager', () => {
    expect(isExternalRole('safety_manager')).toBe(false);
  });

  it('returns false for accountant', () => {
    expect(isExternalRole('accountant')).toBe(false);
  });

  it('returns false for owner', () => {
    expect(isExternalRole('owner')).toBe(false);
  });
});
