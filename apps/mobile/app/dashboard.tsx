import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Dashboard() {
  const stats = [
    { label: "Active Loads", value: "124" },
    { label: "In Transit", value: "87" },
    { label: "Exceptions", value: "6" },
  ];

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Dispatch Dashboard</Text>
      <Text style={{ color: "#334155" }}>Today overview for your fleet and shipment operations.</Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {stats.map((item) => (
          <View
            key={item.label}
            style={{ flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" }}
          >
            <Text style={{ color: "#64748b", fontSize: 12 }}>{item.label}</Text>
            <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "700" }}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Link href="/loadboard" asChild>
        <Pressable style={{ backgroundColor: "#0f172a", borderRadius: 12, padding: 14 }}>
          <Text style={{ color: "#f8fafc", fontWeight: "700" }}>Open Load Board</Text>
        </Pressable>
      </Link>
      <Link href="/shipments" asChild>
        <Pressable style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14 }}>
          <Text style={{ color: "#f8fafc", fontWeight: "700" }}>Open Shipments</Text>
        </Pressable>
      </Link>
    </View>
  );
}
