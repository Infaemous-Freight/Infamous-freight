import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

type TrackingMessage = {
  type: string;
  payload: {
    lat: number;
    lng: number;
    recordedAt: string;
  };
};

export default function App() {
  const [lastPing, setLastPing] = useState<TrackingMessage | null>(null);
  const wsUrl = useMemo(
    () => "ws://localhost:4000/ws/tracking?organizationId=org_demo",
    []
  );

  useEffect(() => {
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as TrackingMessage;
      if (message.type === "gps.ping") {
        setLastPing(message);
      }
    };

    return () => socket.close();
  }, [wsUrl]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f0c" }}>
      <View style={{ padding: 24 }}>
        <Text style={{ color: "#6BFF8E", fontSize: 28, fontWeight: "700" }}>
          Infamous Freight Driver
        </Text>
        <Text style={{ color: "#ffffff", marginTop: 12, fontSize: 16 }}>
          Driver load board, route guidance, anomaly alerts, and live tracking.
        </Text>

        <View style={{ marginTop: 24 }}>
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "600" }}>
            Latest GPS Ping
          </Text>
          <Text style={{ color: "#cfcfcf", marginTop: 8 }}>
            {lastPing
              ? `${lastPing.payload.lat}, ${lastPing.payload.lng} @ ${lastPing.payload.recordedAt}`
              : "Waiting for live tracking..."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
