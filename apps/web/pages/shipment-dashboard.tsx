import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

import { firestore } from "../lib/firebase";

type Shipment = {
  id: string;
  status: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
};

const mapContainerStyle = { height: "600px", width: "100%" };
const usCenter = { lat: 39.8283, lng: -98.5795 };

export default function ShipmentDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, "shipments"), (snapshot) => {
      const rows = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Shipment, "id">),
      }));

      setShipments(rows);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1>Realtime Shipment Dashboard</h1>
      <p>Live map markers stream from Firestore shipment updates.</p>

      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={usCenter} zoom={4}>
          {shipments
            .filter((shipment) => shipment.currentLocation)
            .map((shipment) => (
              <Marker
                key={shipment.id}
                position={shipment.currentLocation!}
                title={`Shipment ${shipment.id} - ${shipment.status}`}
              />
            ))}
        </GoogleMap>
      </LoadScript>
    </main>
  );
}
