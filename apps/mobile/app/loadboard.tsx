import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Loadboard() {
  const loads = [
    { id: "LD-1024", lane: "Dallas → Chicago", rate: "$2,850" },
    { id: "LD-1188", lane: "Atlanta → Miami", rate: "$1,460" },
    { id: "LD-1192", lane: "Houston → Memphis", rate: "$1,980" },
  ];

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>Load Board</Text>
      {loads.map((load) => (
        <View key={load.id} style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e2e8f0" }}>
          <Text style={{ color: "#64748b", fontSize: 12 }}>{load.id}</Text>
          <Text style={{ color: "#0f172a", fontSize: 16, fontWeight: "700" }}>{load.lane}</Text>
          <Text style={{ color: "#334155" }}>{load.rate}</Text>
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
