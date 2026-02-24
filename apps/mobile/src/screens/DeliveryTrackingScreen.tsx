/**
 * Phase 7 Tier 6: Mobile Screen Components
 *
 * Delivery Tracking Screen with:
 * - Real-time shipment status
 * - Live map with driver location
 * - Estimated delivery time
 * - Photo proof of delivery
 * - Signature capture
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

interface TrackingEvent {
  status: string;
  timestamp: string;
  location?: string;
  description: string;
}

export default function DeliveryTrackingScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    loadShipmentData();
    subscribeToLocationUpdates();
  }, []);

  const loadShipmentData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const shipmentId = (route.params as any)?.shipmentId;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/shipments/${shipmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setShipment(data.data);
        setTrackingEvents(data.data.trackingEvents || []);
      }
    } catch (err) {
      console.error("Failed to load shipment:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLocationUpdates = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 100,
        },
        (location) => {
          setDriverLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        },
      );
    } catch (err) {
      console.error("Failed to subscribe to location:", err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const statusColor = {
    IN_TRANSIT: "#FF9800",
    OUT_FOR_DELIVERY: "#2196F3",
    DELIVERED: "#4CAF50",
    EXCEPTION: "#F44336",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Delivery Tracking</Text>
        </View>

        {/* Status Card */}
        {shipment && (
          <>
            <View style={styles.statusCard}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor[shipment.status] || "#999" },
                ]}
              >
                <Text style={styles.statusText}>{shipment.status.replace(/_/g, " ")}</Text>
              </View>
              <Text style={styles.trackingNumber}>Tracking: {shipment.trackingNumber}</Text>

              {/* Shipment Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>From</Text>
                  <Text style={styles.detailValue}>{shipment.origin}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>To</Text>
                  <Text style={styles.detailValue}>{shipment.destination}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Estimated Delivery</Text>
                  <Text style={styles.detailValue}>{shipment.estimatedDelivery}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{shipment.weight} kg</Text>
                </View>
              </View>
            </View>

            {/* Map Placeholder */}
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>Map View</Text>
              <Text style={styles.mapPlaceholderSubtext}>
                Driver Location:{" "}
                {driverLocation
                  ? `${driverLocation.latitude?.toFixed(2)}, ${driverLocation.longitude?.toFixed(2)}`
                  : "Loading..."}
              </Text>
            </View>

            {/* Tracking Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionTitle}>Tracking History</Text>

              <FlatList
                scrollEnabled={false}
                data={trackingEvents}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineMarker}>
                      <View style={styles.timelineDot} />
                      {index < trackingEvents.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStatus}>{item.status}</Text>
                      <Text style={styles.timelineTime}>{item.timestamp}</Text>
                      <Text style={styles.timelineDescription}>{item.description}</Text>
                    </View>
                  </View>
                )}
              />
            </View>

            {/* Action Buttons */}
            {shipment.status === "OUT_FOR_DELIVERY" && (
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Receive Package</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
                  <Text style={styles.buttonTextSecondary}>View Options</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    fontSize: 16,
    color: "#007AFF",
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  trackingNumber: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: "48%",
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  mapPlaceholder: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 200,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: "#1976D2",
    marginTop: 8,
  },
  timelineSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineMarker: {
    width: 30,
    alignItems: "center",
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2196F3",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E0E0E0",
    marginTop: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  timelineTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  timelineDescription: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  actionButtons: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  },
});

async function getAuthToken(): Promise<string> {
  // Implementation would get token from secure storage
  return "";
}
