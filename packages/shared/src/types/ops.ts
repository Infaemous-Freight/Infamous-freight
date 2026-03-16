export interface Organization {
  id: string;
  name: string;
  dotNumber: string | null;
  mcNumber: string | null;
  plan: OrgPlan;
  createdAt: Date;
  updatedAt: Date;
}

export type OrgPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface AuditEvent {
  id: string;
  orgId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
