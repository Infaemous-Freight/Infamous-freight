/**
 * Push Notifications Service
 * Handles Expo push notifications for shipment updates
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_TOKEN_KEY = "@push_token";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private pushToken: string | null = null;

  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission for push notifications not granted");
      return null;
    }

    // Get push token
    const token = await this.getPushToken();
    return token;
  }

  async getPushToken(): Promise<string | null> {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || "your-project-id",
      });
      this.pushToken = tokenData.data;

      // Store token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);

      // Configure Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  }

  async registerToken(apiClient: any): Promise<void> {
    if (!this.pushToken) {
      console.log("No push token available");
      return;
    }

    try {
      await apiClient.registerPushToken(this.pushToken);
      console.log("Push token registered with server");
    } catch (error) {
      console.error("Failed to register push token:", error);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  setupNotificationListener(
    onNotificationReceived: (notification: Notifications.Notification) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(
      onNotificationReceived,
    );
  }

  setupNotificationResponseListener(
    onNotificationTapped: (
      response: Notifications.NotificationResponse,
    ) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(
      onNotificationTapped,
    );
  }
}

export const pushNotifications = new PushNotificationService();
