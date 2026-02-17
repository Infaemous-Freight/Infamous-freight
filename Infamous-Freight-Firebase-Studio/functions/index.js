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
  const beforeSnap = event.data.before;
  const afterSnap = event.data.after;
  const shipmentId = event.params.shipmentId;

  if (!beforeSnap || !afterSnap) {
    logger.info('No shipment payload found for update.', {shipmentId});
    return;
  }

  const before = beforeSnap.data();
  const after = afterSnap.data();
  const beforeLocation = before.currentLocation || null;
  const afterLocation = after.currentLocation || null;

  const beforeLat = beforeLocation ? beforeLocation.lat : undefined;
  const beforeLng = beforeLocation ? beforeLocation.lng : undefined;
  const afterLat = afterLocation ? afterLocation.lat : undefined;
  const afterLng = afterLocation ? afterLocation.lng : undefined;

  if (beforeLat === afterLat && beforeLng === afterLng) {
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
  const BATCH_SIZE = 100;
  let lastDoc = null;
  let totalNotifications = 0;

  // Paginate through in-transit shipments in bounded batches
  // to avoid scanning the entire collection in a single query.
  // This keeps memory usage and execution time under control
  // as the shipments collection grows.
  // We order by document ID for stable pagination.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = db.collection('shipments')
        .where('status', '==', 'in_transit')
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(BATCH_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    let batchCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const etaMs = data.eta?.toMillis ? data.eta.toMillis() : null;

      if (etaMs && etaMs < now) {
        const ref = db.collection('events').doc();
        batch.set(ref, {
          shipmentId: doc.id,
          driverId: data.driverId || null,
          message: `Shipment ${doc.id} is delayed.`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          type: 'DELAY_ALERT',
          source: 'notifyDelayedShipment',
        });
        batchCount += 1;
        totalNotifications += 1;
      }
    });

    if (batchCount > 0) {
      await batch.commit();
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  if (!totalNotifications) {
    logger.info('No delayed shipments found.');
    return;
  }

  logger.info('Delayed shipment notifications created.', {count: totalNotifications});
  // Optional placeholders:
  // 1) Zenphi webhook integration
  // 2) Firebase Cloud Messaging push notifications
});
