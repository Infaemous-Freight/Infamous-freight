const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.updateShipmentLocation = functions.pubsub
  .topic('shipment-updates')
  .onPublish(async (message) => {
    const data = message.json;
    const { shipmentId, lat, lng, status } = data;

    if (!shipmentId || typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('shipmentId, lat, and lng are required.');
    }

    await admin.firestore().collection('shipments').doc(shipmentId).update({
      currentLocation: { lat, lng },
      status: status ?? 'in_transit',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Shipment ${shipmentId} updated.`);
  });

exports.notifyDelayedShipment = functions.firestore
  .document('shipments/{shipmentId}')
  .onUpdate((change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (after.status === 'delayed' && before.status !== 'delayed') {
      console.log(`Shipment ${context.params.shipmentId} is delayed`);
    }

    return null;
  });
