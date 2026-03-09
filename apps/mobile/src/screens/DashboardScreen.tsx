/**
 * Dashboard Screen - Driver Home
 * Shows earnings, current job, and quick stats
 */

import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";
import type { DriverProfile } from "@infamous/shared";

const { width } = Dimensions.get("window");

interface DashboardStats {
  todaysEarnings: number;
  totalJobs: number;
  completedJobs: number;
  rating: number;
  onTimePercentage: number;
  currentLoad?: {
    id: string;
    destination: string;
    miles: number;
    rate: number;
    status: string;
  };
}

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_BASE_URL;
      let dashboardData: DashboardStats | null = null;

      if (apiBaseUrl) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/analytics/driver/dashboard?days=30`);
          if (response.ok) {
            const result = await response.json();
            if (result?.success && result.data) {
              dashboardData = result.data;
            }
          }
        } catch (apiError) {
          console.warn("Dashboard API unavailable, using mock data:", apiError);
        }
      }

      const mockStats: DashboardStats = {
        todaysEarnings: 287.5,
        totalJobs: 156,
        completedJobs: 154,
        rating: 4.8,
        onTimePercentage: 96,
        currentLoad: {
          id: "LOAD-001",
          destination: "Los Angeles, CA",
          miles: 487,
          rate: 1.25,
          status: "IN_TRANSIT",
        },
      };

      setStats(dashboardData || mockStats);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData().finally(() => setRefreshing(false));
  };

  if (loading && !stats) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Earnings Card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Today's Earnings</Text>
        <Text style={styles.earningsAmount}>${stats?.todaysEarnings.toFixed(2)}</Text>
        <View style={styles.earningsRow}>
          <Text style={styles.earningsSubtext}>{stats?.completedJobs} jobs completed</Text>
          <Text style={styles.earningsSubtext}>{stats?.onTimePercentage}% on-time</Text>
        </View>
      </View>

      {/* Current Load Card */}
      {stats?.currentLoad && (
        <TouchableOpacity
          style={styles.currentLoadCard}
          onPress={() => navigation.navigate("Shipments")}
        >
          <View style={styles.currentLoadHeader}>
            <Text style={styles.currentLoadTitle}>Current Load</Text>
            <MaterialCommunityIcons name="truck" size={24} color={colors.primary} />
          </View>

          <Text style={styles.currentLoadDestination}>{stats.currentLoad.destination}</Text>

          <View style={styles.currentLoadDetails}>
            <View style={styles.loadDetail}>
              <MaterialCommunityIcons name="map-marker" size={16} color={colors.gray600} />
              <Text style={styles.loadDetailText}>{stats.currentLoad.miles} miles</Text>
            </View>
            <View style={styles.loadDetail}>
              <MaterialCommunityIcons name="cash" size={16} color={colors.gray600} />
              <Text style={styles.loadDetailText}>
                ${(stats.currentLoad.miles * stats.currentLoad.rate).toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigation.navigate("Map")}
          >
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rating</Text>
          <Text style={styles.statValue}>{stats?.rating.toFixed(1)}</Text>
          <View style={styles.starContainer}>
            {[...Array(5)].map((_, i) => (
              <MaterialCommunityIcons
                key={i}
                name={i < Math.floor(stats?.rating || 0) ? "star" : "star-outline"}
                size={14}
                color={colors.warning}
              />
            ))}
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Jobs</Text>
          <Text style={styles.statValue}>{stats?.totalJobs}</Text>
          <Text style={styles.statSubtext}>this month</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate("Map")}
        >
          <MaterialCommunityIcons name="map" size={24} color={colors.primary} />
          <Text style={styles.quickActionText}>View Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate("Shipments")}
        >
          <MaterialCommunityIcons name="clipboard-list" size={24} color={colors.primary} />
          <Text style={styles.quickActionText}>My Shipments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate("Account")}
        >
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
          <Text style={styles.quickActionText}>Account Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Performance Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
        <Text style={styles.tipText}>• Accept loads quickly to build your reputation</Text>
        <Text style={styles.tipText}>• Maintain your on-time percentage above 95%</Text>
        <Text style={styles.tipText}>• Clean your truck between loads for higher ratings</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: spacing.xl,
  },
  earningsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.lg,
  },
  earningsLabel: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  earningsAmount: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  earningsSubtext: {
    ...typography.caption,
    color: colors.white,
    opacity: 0.8,
  },
  currentLoadCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentLoadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  currentLoadTitle: {
    ...typography.subtitle,
    color: colors.gray900,
  },
  currentLoadDestination: {
    ...typography.h2,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  currentLoadDetails: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  loadDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadDetailText: {
    ...typography.body,
    color: colors.gray600,
  },
  navigateButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  navigateButtonText: {
    ...typography.button,
    color: colors.white,
  },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray600,
  },
  statValue: {
    ...typography.h2,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  statSubtext: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  starContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  quickActionsContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  quickActionsTitle: {
    ...typography.subtitle,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  quickActionText: {
    ...typography.body,
    color: colors.gray900,
  },
  tipsContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.info,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  tipsTitle: {
    ...typography.subtitle,
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  tipText: {
    ...typography.body,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
});

export default DashboardScreen;
