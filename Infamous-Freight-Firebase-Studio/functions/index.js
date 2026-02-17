const admin = require('firebase-admin');
const {onDocumentUpdated} = require('firebase-functions/v2/firestore');
const {onSchedule} = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered whenever a shipment document is updated.
 * Updates latest location event and shipment metadata.
 */
exports.updateShipmentLocation = onDocumentUpdated('shipments/{shipmentId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const shipmentId = event.params.shipmentId;

  if (!before || !after) {
    logger.info('No shipment payload found for update.', {shipmentId});
    return;
  }

  const beforeLocation = JSON.stringify(before.currentLocation || {});
  const afterLocation = JSON.stringify(after.currentLocation || {});

  if (beforeLocation === afterLocation) {
    logger.info('Shipment location unchanged.', {shipmentId});
    return;
  }

  await db.collection('events').add({
    shipmentId,
    type: 'LOCATION_UPDATED',
    location: after.currentLocation || null,
    source: 'updateShipmentLocation',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await event.data.ref.set({
    lastTrackedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: after.status || 'in_transit',
  }, {merge: true});

  logger.info('Shipment location updated successfully.', {shipmentId});
});

/**
 * Scheduled job that checks for delayed shipments and emits notifications.
 */
exports.notifyDelayedShipment = onSchedule('every 15 minutes', async () => {
  const now = Date.now();
  const delayed = await db.collection('shipments')
      .where('status', '==', 'in_transit')
      .get();

  const notifications = [];

  delayed.forEach((doc) => {
    const data = doc.data();
    const etaMs = data.eta?.toMillis ? data.eta.toMillis() : null;

    if (etaMs && etaMs < now) {
      notifications.push({
        shipmentId: doc.id,
        driverId: data.driverId || null,
        message: `Shipment ${doc.id} is delayed.`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  if (!notifications.length) {
    logger.info('No delayed shipments found.');
    return;
  }

  const batch = db.batch();
  notifications.forEach((item) => {
    const ref = db.collection('events').doc();
    batch.set(ref, {
      ...item,
      type: 'DELAY_ALERT',
      source: 'notifyDelayedShipment',
    });
  });

  await batch.commit();
  logger.info('Delayed shipment notifications created.', {count: notifications.length});

  // Optional placeholders:
  // 1) Zenphi webhook integration
  // 2) Firebase Cloud Messaging push notifications
});
