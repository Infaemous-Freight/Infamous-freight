/**
 * React Native Navigation Setup - 100% User-Friendly
 * Bottom tabs with accessibility and haptic feedback
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

// Import your screens
// import DashboardScreen from '../screens/DashboardScreen';
// import ShipmentsScreen from '../screens/ShipmentsScreen';
// import MapScreen from '../screens/MapScreen';
// import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

// Placeholder screens for demo
const DashboardScreen = () => null;
const ShipmentsScreen = () => null;
const MapScreen = () => null;
const AccountScreen = () => null;

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Dashboard") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Shipments") {
              iconName = focused ? "cube" : "cube-outline";
            } else if (route.name === "Map") {
              iconName = focused ? "map" : "map-outline";
            } else if (route.name === "Account") {
              iconName = focused ? "person" : "person-outline";
            } else {
              iconName = "help-circle-outline";
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#0066CC",
          tabBarInactiveTintColor: "#6C757D",
          tabBarStyle: {
            paddingBottom: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          headerShown: true,
          headerStyle: {
            backgroundColor: "#0066CC",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                props.onPress?.(e);
              }}
            />
          ),
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            headerTitle: "Dashboard",
          }}
        />
        <Tab.Screen
          name="Shipments"
          component={ShipmentsScreen}
          options={{
            tabBarLabel: "Shipments",
            headerTitle: "My Shipments",
            tabBarBadge: 3, // Example badge
          }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{
            tabBarLabel: "Map",
            headerTitle: "Track Shipments",
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarLabel: "Account",
            headerTitle: "My Account",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
