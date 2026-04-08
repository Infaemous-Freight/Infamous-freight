import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Shipments() {
  const shipments = [
    { id: "IF-482193", status: "In Transit", eta: "10:30 AM" },
    { id: "IF-482245", status: "At Pickup", eta: "1:15 PM" },
    { id: "IF-482251", status: "Delivered", eta: "Completed" },
  ];

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Shipments</Text>
      {shipments.map((shipment) => (
        <View
          key={shipment.id}
          style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" }}
        >
          <Text style={{ color: "#64748b", fontSize: 12 }}>{shipment.id}</Text>
          <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "700" }}>{shipment.status}</Text>
          <Text style={{ color: "#334155" }}>ETA: {shipment.eta}</Text>
        </View>
      ))}
      <Link href="/dashboard" asChild>
        <Pressable style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 14 }}>
          <Text style={{ color: "#f8fafc", fontWeight: "700" }}>Back to Dashboard</Text>
        </Pressable>
      </Link>
    </View>
  );
}
