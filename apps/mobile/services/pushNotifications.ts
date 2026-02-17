/**
 * Push Notifications Service
 * Handles both Expo push notifications and Firebase Cloud Messaging
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const PUSH_TOKEN_KEY = "@push_token";
const FCM_TOKEN_KEY = "@fcm_token";

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
  private fcmToken: string | null = null;

  async initialize(): Promise<{ expoPushToken: string | null; fcmToken: string | null }> {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return { expoPushToken: null, fcmToken: null };
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission for push notifications not granted");
      return { expoPushToken: null, fcmToken: null };
    }

    // Get both Expo push token and FCM token
    const expoPushToken = await this.getExpoPushToken();
    const fcmToken = await this.getFCMToken();

    return { expoPushToken, fcmToken };
  }

  async getExpoPushToken(): Promise<string | null> {
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
      console.error("Failed to get Expo push token:", error);
      return null;
    }
  }

  async getFCMToken(): Promise<string | null> {
    try {
      // Firebase Cloud Messaging is only available on web
      if (Platform.OS === "web") {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: process.env.FIREBASE_VAPID_KEY,
        });

        this.fcmToken = token;
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

        console.log("FCM Token obtained:", token.substring(0, 20) + "...");
        return token;
      } else {
        // On native platforms, use Expo's push token which can be converted to FCM
        console.log("Using Expo push token for FCM on native platforms");
        return this.pushToken;
      }
    } catch (error) {
      console.error("Failed to get FCM token:", error);
      return null;
    }
  }

  async registerToken(apiClient: any): Promise<void> {
    const tokens = {
      expoPushToken: this.pushToken,
      fcmToken: this.fcmToken,
      platform: Platform.OS,
    };

    if (!tokens.expoPushToken && !tokens.fcmToken) {
      console.log("No push tokens available");
      return;
    }

    try {
      await apiClient.registerPushToken(tokens);
      console.log("Push tokens registered with server");
    } catch (error) {
      console.error("Failed to register push tokens:", error);
    }
  }

  setupFCMMessageListener(): void {
    if (Platform.OS === "web") {
      const messaging = getMessaging();
      onMessage(messaging, (payload) => {
        console.log("FCM message received:", payload);
        if (payload.notification) {
          this.scheduleLocalNotification(
            payload.notification.title || "Notification",
            payload.notification.body || "",
            payload.data,
          );
        }
      });
    }
  }

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
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
    return Notifications.addNotificationReceivedListener(onNotificationReceived);
  }

  setupNotificationResponseListener(
    onNotificationTapped: (response: Notifications.NotificationResponse) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(onNotificationTapped);
  }
}

export const pushNotifications = new PushNotificationService();
