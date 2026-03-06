import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Dashboard() {
  return (
    <View style={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Dashboard</Text>
      <Link href="/loadboard">Load Board</Link>
      <Link href="/shipments">Shipments</Link>
    </View>
  );
}
