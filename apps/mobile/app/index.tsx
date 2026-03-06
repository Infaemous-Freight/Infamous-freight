import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
      <Text>Infæmous Freight Mobile</Text>
      <Link href="/dashboard">Dashboard</Link>
    </View>
  );
}
