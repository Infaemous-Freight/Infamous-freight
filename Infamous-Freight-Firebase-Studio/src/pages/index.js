import {useMemo} from 'react';

const sampleShipments = [
  {id: 'SHIP-1001', name: 'Seattle → Denver', lat: 47.6062, lng: -122.3321, status: 'in_transit'},
  {id: 'SHIP-1002', name: 'Austin → Miami', lat: 30.2672, lng: -97.7431, status: 'delayed'},
  {id: 'SHIP-1003', name: 'Chicago → Atlanta', lat: 41.8781, lng: -87.6298, status: 'in_transit'},
];

export default function Dashboard() {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapUrl = useMemo(() => {
    if (!mapsApiKey) {
      return null;
    }

    return `https://www.google.com/maps/embed/v1/view?key=${mapsApiKey}&center=39.8283,-98.5795&zoom=4`;
  }, [mapsApiKey]);

  const predictEtaWithVertexAi = async (shipment) => {
    // Example placeholder for Vertex AI prediction call.
    // Replace with secure backend endpoint that invokes Vertex AI.
    const response = await fetch('/api/predict-eta', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        shipmentId: shipment.id,
        routeName: shipment.name,
        currentStatus: shipment.status,
      }),
    });

    if (!response.ok) {
      throw new Error('ETA prediction failed');
    }

    return response.json();
  };

  return (
    <main style={{fontFamily: 'Arial, sans-serif', padding: '24px', maxWidth: '1080px', margin: '0 auto'}}>
      <h1>Infæmous Freight Dashboard</h1>
      <p>Realtime shipment tracking with Firebase + Google Maps.</p>

      <section style={{marginBottom: '24px'}}>
        <h2>Map Overview</h2>
        {mapUrl ? (
          <iframe
            title="Shipment Map"
            width="100%"
            height="420"
            style={{border: 0, borderRadius: '8px'}}
            loading="lazy"
            allowFullScreen
            src={mapUrl}
          />
        ) : (
          <p>Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to render Google Maps.</p>
        )}
      </section>

      <section>
        <h2>Shipment Markers</h2>
        <ul>
          {sampleShipments.map((shipment) => (
            <li key={shipment.id} style={{marginBottom: '12px'}}>
              <strong>{shipment.id}</strong> — {shipment.name} ({shipment.status})
              <br />
              Marker: {shipment.lat}, {shipment.lng}
              <br />
              <button
                type="button"
                onClick={() => predictEtaWithVertexAi(shipment).then(console.log).catch(console.error)}
              >
                Predict ETA (Vertex AI example)
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
