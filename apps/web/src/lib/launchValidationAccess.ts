const OWNER_ADMIN_ROLES = new Set(['owner', 'admin']);

export function isLaunchValidationEnabled(): boolean {
  const flag = import.meta.env.VITE_LAUNCH_VALIDATION_ENABLED;

  if (flag === 'true') {
    return true;
  }

  if (flag === 'false') {
    return false;
  }

  // Keep local/staging development easy, but keep production closed unless explicitly enabled.
  return import.meta.env.MODE !== 'production';
}

export function canAccessLaunchValidation(role?: string | null): boolean {
  return isLaunchValidationEnabled() && OWNER_ADMIN_ROLES.has((role ?? '').toLowerCase());
}
