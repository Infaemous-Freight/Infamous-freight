import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f0c" }}>
      <View style={{ padding: 24 }}>
        <Text style={{ color: "#6BFF8E", fontSize: 28, fontWeight: "700" }}>
          Infamous Freight Driver
        </Text>
        <Text style={{ color: "#ffffff", marginTop: 12, fontSize: 16 }}>
          Driver load board, route guidance, anomaly alerts, and check-ins live here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
