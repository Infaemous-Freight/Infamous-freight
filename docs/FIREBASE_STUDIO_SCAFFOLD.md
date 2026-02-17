# Firebase Studio Scaffold (Infæmous Freight)

## 1. Firestore schema

Reference schema lives at `firebase/firestore.schema.json` with collections for:

- `shipments`
- `drivers`
- `events`

## 2. Cloud Functions

Firebase Functions entrypoint: `firebase/functions/index.js`

Implemented functions:

- `updateShipmentLocation` (Pub/Sub topic `shipment-updates`)
- `notifyDelayedShipment` (Firestore update trigger)

## 3. Vertex AI ETA prediction helper

`firebase/functions/vertexEta.js` exports `predictETA(shipmentFeatures)` using
Vertex AI `PredictionServiceClient`.

## 4. Next.js map dashboard

Page: `apps/web/pages/shipment-dashboard.tsx`

- Streams Firestore updates from `shipments` collection
- Renders Google Maps markers for active shipment locations

Firebase client: `apps/web/lib/firebase.ts`

## 5. Required environment variables

Add these vars to your local `.env.local` (and deployment environments):

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_MAPS_KEY
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 6. Deployment

```bash
firebase deploy --only hosting
firebase deploy --only functions
```
