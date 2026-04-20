import { Injectable, Logger } from '@nestjs/common';

export type UserRole = 'owner' | 'dispatcher' | 'safety_manager' | 'accountant' | 'driver';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  carrierId: string;
  invitedBy: string;
  status: 'active' | 'pending' | 'inactive';
  permissions: Permission[];
  createdAt: Date;
  lastActiveAt?: Date;
}

export type Permission =
  // Loads
  | 'loads:view' | 'loads:create' | 'loads:assign' | 'loads:delete'
  // Drivers
  | 'drivers:view' | 'drivers:create' | 'drivers:edit' | 'drivers:delete'
  // Invoices
  | 'invoices:view' | 'invoices:create' | 'invoices:send' | 'invoices:delete'
  // Analytics
  | 'analytics:view' | 'analytics:export'
  // Settings
  | 'settings:view' | 'settings:edit'
  // Team
  | 'team:view' | 'team:invite' | 'team:edit' | 'team:remove'
  // Safety
  | 'safety:view' | 'safety:hos' | 'safety:violations'
  // Documents
  | 'documents:view' | 'documents:upload' | 'documents:delete'
  // ELD
  | 'eld:view' | 'eld:connect' | 'eld:disconnect';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'loads:view', 'loads:create', 'loads:assign', 'loads:delete',
    'drivers:view', 'drivers:create', 'drivers:edit', 'drivers:delete',
    'invoices:view', 'invoices:create', 'invoices:send', 'invoices:delete',
    'analytics:view', 'analytics:export',
    'settings:view', 'settings:edit',
    'team:view', 'team:invite', 'team:edit', 'team:remove',
    'safety:view', 'safety:hos', 'safety:violations',
    'documents:view', 'documents:upload', 'documents:delete',
    'eld:view', 'eld:connect', 'eld:disconnect',
  ],
  dispatcher: [
    'loads:view', 'loads:create', 'loads:assign',
    'drivers:view', 'drivers:edit',
    'invoices:view', 'invoices:create',
    'analytics:view',
    'documents:view', 'documents:upload',
    'eld:view',
  ],
  safety_manager: [
    'drivers:view', 'drivers:edit',
    'safety:view', 'safety:hos', 'safety:violations',
    'documents:view', 'documents:upload',
    'eld:view',
    'analytics:view',
  ],
  accountant: [
    'invoices:view', 'invoices:create', 'invoices:send',
    'analytics:view', 'analytics:export',
    'documents:view', 'documents:upload',
  ],
  driver: [
    'loads:view',
    'documents:view', 'documents:upload',
    'eld:view',
  ],
};

@Injectable()
export class RBACService {
  private readonly logger = new Logger(RBACService.name);
  private members: Map<string, TeamMember> = new Map();

  async inviteMember(
    carrierId: string,
    email: string,
    role: UserRole,
    invitedBy: string,
  ): Promise<TeamMember> {
    const id = `member_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const member: TeamMember = {
      id,
      email,
      name: email.split('@')[0],
      role,
      carrierId,
      invitedBy,
      status: 'pending',
      permissions: ROLE_PERMISSIONS[role],
      createdAt: new Date(),
    };

    this.members.set(id, member);
    this.logger.log(`Invited ${email} as ${role} to carrier ${carrierId}`);

    // TODO: Send invitation email

    return member;
  }

  async acceptInvite(memberId: string, name: string): Promise<TeamMember> {
    const member = this.members.get(memberId);
    if (!member) throw new Error('Invite not found');

    member.status = 'active';
    member.name = name;
    member.lastActiveAt = new Date();

    return member;
  }

  async removeMember(memberId: string, removedBy: string): Promise<void> {
    const member = this.members.get(memberId);
    if (!member) return;

    member.status = 'inactive';
    this.logger.log(`Member ${memberId} removed by ${removedBy}`);
  }

  async updateRole(memberId: string, newRole: UserRole): Promise<TeamMember> {
    const member = this.members.get(memberId);
    if (!member) throw new Error('Member not found');

    member.role = newRole;
    member.permissions = ROLE_PERMISSIONS[newRole];

    return member;
  }

  async getTeamMembers(carrierId: string): Promise<TeamMember[]> {
    return Array.from(this.members.values())
      .filter(m => m.carrierId === carrierId && m.status !== 'inactive');
  }

  async getMember(userId: string): Promise<TeamMember | null> {
    return this.members.get(userId) || null;
  }

  hasPermission(member: TeamMember, permission: Permission): boolean {
    return member.permissions.includes(permission);
  }

  hasAnyPermission(member: TeamMember, permissions: Permission[]): boolean {
    return permissions.some(p => member.permissions.includes(p));
  }

  // UI helpers - determine what menus/features to show
  getMenuVisibility(role: UserRole): Record<string, boolean> {
    const perms = ROLE_PERMISSIONS[role];
    return {
      dashboard: true,
      loads: perms.includes('loads:view'),
      dispatch: perms.includes('loads:assign'),
      drivers: perms.includes('drivers:view'),
      invoices: perms.includes('invoices:view'),
      analytics: perms.includes('analytics:view'),
      safety: perms.includes('safety:view'),
      documents: perms.includes('documents:view'),
      eld: perms.includes('eld:view'),
      team: perms.includes('team:view'),
      settings: perms.includes('settings:view'),
    };
  }
}
