import { randomUUID } from 'crypto';
import { FreightOperationRecord, LoadRecord } from './data-store';

export type WorkflowAlertType =
  | 'quote_request_received'
  | 'carrier_document_reminder'
  | 'insurance_expiration_reminder'
  | 'stale_load_update'
  | 'missing_pod_reminder'
  | 'overdue_invoice'
  | 'exception_alert';

export type WorkflowAlertSeverity = 'info' | 'warning' | 'critical';

export type WorkflowAlert = {
  id: string;
  type: WorkflowAlertType;
  severity: WorkflowAlertSeverity;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  createdAt: string;
};

export const ALERT_WINDOW_DAYS = 30;
const ACTIVE_LOAD_STATUSES = new Set(['booked', 'in_transit', 'dispatched', 'at_pickup', 'loaded', 'carrier_assigned']);

export function buildWorkflowAlerts(
  tenantId: string,
  quoteRequests: FreightOperationRecord[],
  loads: LoadRecord[],
  shipmentTracking: FreightOperationRecord[],
  carrierPayments: FreightOperationRecord[],
  rateAgreements: FreightOperationRecord[],
): WorkflowAlert[] {
  const alerts: WorkflowAlert[] = [];
  const now = new Date();
  const windowMs = ALERT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // 1. Quote request alert — pending quote requests awaiting review
  for (const quote of quoteRequests) {
    if (quote.status === 'pending' || quote.status === 'new') {
      alerts.push({
        id: randomUUID(),
        type: 'quote_request_received',
        severity: 'info',
        title: 'New Quote Request',
        message: `Quote request from ${quote.brokerName ?? 'unknown shipper'} is awaiting review.`,
        entityType: 'quoteRequest',
        entityId: String(quote.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  // 2. Carrier document reminder — rate agreements with pending or missing status
  for (const agreement of rateAgreements) {
    if (agreement.status === 'pending' || agreement.status === 'missing') {
      alerts.push({
        id: randomUUID(),
        type: 'carrier_document_reminder',
        severity: 'warning',
        title: 'Carrier Document Reminder',
        message: 'Carrier has missing or incomplete documents required for compliance approval.',
        entityType: 'rateAgreement',
        entityId: String(agreement.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  // 3. Insurance expiration reminder — rate agreements expiring within the alert window
  for (const agreement of rateAgreements) {
    if (!agreement.expiryDate) {
      continue;
    }
    const expiryDate = new Date(String(agreement.expiryDate));
    const msUntilExpiry = expiryDate.getTime() - now.getTime();
    if (msUntilExpiry > 0 && msUntilExpiry <= windowMs) {
      alerts.push({
        id: randomUUID(),
        type: 'insurance_expiration_reminder',
        severity: 'warning',
        title: 'Insurance Expiring Soon',
        message: `Carrier rate agreement expires on ${expiryDate.toISOString().slice(0, 10)}. Renew before it lapses.`,
        entityType: 'rateAgreement',
        entityId: String(agreement.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  // 4. Stale load update alert — active loads with no shipment tracking entries
  const trackedLoadIds = new Set(shipmentTracking.map((t) => String(t.loadId)));
  for (const load of loads) {
    if (ACTIVE_LOAD_STATUSES.has(String(load.status)) && !trackedLoadIds.has(String(load.id))) {
      alerts.push({
        id: randomUUID(),
        type: 'stale_load_update',
        severity: 'warning',
        title: 'Stale Load — No Tracking Updates',
        message: `Load is active with status "${load.status}" but has no tracking updates on record.`,
        entityType: 'load',
        entityId: String(load.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  // 5. Missing POD reminder — delivered shipments where POD has not been received
  for (const tracking of shipmentTracking) {
    if (tracking.status === 'delivered' && !tracking.podReceived) {
      alerts.push({
        id: randomUUID(),
        type: 'missing_pod_reminder',
        severity: 'warning',
        title: 'Missing POD',
        message: `Load has been marked delivered but proof of delivery has not been received.`,
        entityType: 'shipmentTracking',
        entityId: String(tracking.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  // 6. Overdue invoice alert — carrier payments still in pending status
  for (const payment of carrierPayments) {
    if (payment.status === 'pending') {
      alerts.push({
        id: randomUUID(),
        type: 'overdue_invoice',
        severity: 'critical',
        title: 'Overdue Invoice',
        message: `Carrier payment is still pending. Review and process to avoid payment delays.`,
        entityType: 'carrierPayment',
        entityId: String(payment.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  // 7. Exception alert — loads or tracking entries with exception status
  for (const load of loads) {
    if (load.status === 'exception') {
      alerts.push({
        id: randomUUID(),
        type: 'exception_alert',
        severity: 'critical',
        title: 'Load Exception',
        message: `Load has an unresolved exception requiring immediate attention.`,
        entityType: 'load',
        entityId: String(load.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }
  for (const tracking of shipmentTracking) {
    if (tracking.status === 'exception') {
      alerts.push({
        id: randomUUID(),
        type: 'exception_alert',
        severity: 'critical',
        title: 'Shipment Exception',
        message: `Shipment tracking has reported an exception for this load.`,
        entityType: 'shipmentTracking',
        entityId: String(tracking.id),
        tenantId,
        createdAt: now.toISOString(),
      });
    }
  }

  return alerts;
}
