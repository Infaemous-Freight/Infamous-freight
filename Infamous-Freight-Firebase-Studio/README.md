# Infæmous Freight Firebase Studio Starter

This repository is a Firebase Studio-ready starter for realtime freight tracking
with a Next.js dashboard, Firestore templates, and Cloud Functions.

## Project structure

```text
Infamous-Freight-Firebase-Studio/
├─ functions/
│  ├─ index.js
│  ├─ package.json
├─ firestore.rules
├─ public/
├─ src/
│  ├─ pages/
│  │  ├─ index.js
│  ├─ firebase.js
├─ .env.local
├─ firebase.json
├─ package.json
└─ README.md
```

## 1) Install dependencies

Run dependency install in both the frontend root and `functions/` directory:

```bash
npm install
cd functions && npm install
```

## 2) Firebase login and project setup

Authenticate and target your Firebase project:

```bash
firebase login
firebase use <project-id>
```

## 3) Deploy backend (Cloud Functions)

```bash
firebase deploy --only functions
```

## 4) Deploy frontend (Hosting)

```bash
firebase deploy --only hosting
```

## 5) Environment variables setup

Create or update `.env.local` with values for your project:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

## Firestore collection templates

Use these collections as the base data model:

### `shipments`

```json
{
  "driverId": "DRV-100",
  "origin": "Seattle, WA",
  "destination": "Denver, CO",
  "status": "in_transit",
  "currentLocation": { "lat": 47.6062, "lng": -122.3321 },
  "eta": "2026-02-20T18:30:00.000Z",
  "lastTrackedAt": "serverTimestamp"
}
```

### `drivers`

```json
{
  "name": "Jamie Carter",
  "phone": "+1-555-0100",
  "vehicle": "Truck 17",
  "isActive": true
}
```

### `events`

```json
{
  "shipmentId": "SHIP-1001",
  "type": "LOCATION_UPDATED",
  "message": "Shipment location updated.",
  "createdAt": "serverTimestamp"
}
```

## Included Cloud Function templates

- `updateShipmentLocation`: Firestore trigger for shipment location updates and
  event logging.
- `notifyDelayedShipment`: Scheduled function that creates delay alerts.

Optional placeholders are included for:

- Zenphi webhook automation
- Firebase Cloud Messaging (FCM) notifications

## Next.js + Google Maps template

The dashboard page (`src/pages/index.js`) contains:

- A Google Maps embed setup via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Pre-seeded shipment marker examples
- A button calling a Vertex AI ETA prediction placeholder endpoint

## Vertex AI integration example (placeholder)

`predictEtaWithVertexAi` in `src/pages/index.js` calls:

```http
POST /api/predict-eta
```

Implement this route in a secure backend that forwards approved fields to Vertex
AI prediction endpoints. Keep model credentials server-side only.

## Optional integrations

- **Zenphi:** Add workflow webhook invocation from `notifyDelayedShipment`.
- **FCM:** Add push tokens per driver and dispatch notifications when delay
  events are generated.
