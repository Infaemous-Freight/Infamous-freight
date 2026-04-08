import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  const routes = [
    { label: "Operations Dashboard", href: "/dashboard" as const },
    { label: "Live Load Board", href: "/loadboard" as const },
    { label: "Shipments", href: "/shipments" as const },
  ];

  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        justifyContent: "center",
        gap: 14,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a" }}>Infamous Freight</Text>
      <Text style={{ fontSize: 16, color: "#334155", marginBottom: 8 }}>
        Mobile control center for dispatch, drivers, and shipment visibility.
      </Text>

      {routes.map((route) => (
        <Link key={route.href} href={route.href} asChild>
          <Pressable
            style={{
              backgroundColor: "#0f172a",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#f8fafc", fontWeight: "700", fontSize: 15 }}>{route.label}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
