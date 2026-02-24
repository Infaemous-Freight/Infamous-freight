/**
 * Phase 7 Tier 6: Push Notifications Service
 *
 * Handles:
 * - Device token registration with Firebase Cloud Messaging (FCM)
 * - Push notification reception and handling
 * - Local foreground notifications using expo-notifications
 * - Topic-based subscriptions (e.g., shipment updates, alerts)
 * - Notification tap/interaction tracking
 *
 * Installation:
 * npm install expo-notifications firebase @react-native-async-storage/async-storage
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseApp } from "./firebase";

/**
 * Request user permission for push notifications
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn("Must use physical device for push notifications");
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permission not granted");
      return false;
    }

    // Set up notification channel for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return true;
  } catch (err) {
    console.error("Failed to request notification permissions:", err);
    return false;
  }
}

/**
 * Register device for push notifications
 * @returns {Promise<string>} Device notification token
 */
export async function registerForPushNotifications(): Promise<string> {
  try {
    const permission = await requestNotificationPermissions();
    if (!permission) {
      throw new Error("Notification permissions not granted");
    }

    // Get FCM token from Firebase
    const messaging = getMessaging(firebaseApp);
    const fcmToken = await getToken(messaging, {
      vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (!fcmToken) {
      throw new Error("Failed to get FCM token");
    }

    // Save token to device storage
    await AsyncStorage.setItem("pushNotificationToken", fcmToken);

    console.log("✓ Device registered for push notifications:", fcmToken);

    return fcmToken;
  } catch (err) {
    console.error("Failed to register for push notifications:", err);
    throw err;
  }
}

/**
 * Subscribe device to notification topic
 * @param {string} topic - Topic name (e.g., 'shipment-updates', 'alerts')
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  try {
    const messaging = getMessaging(firebaseApp);
    const token = await AsyncStorage.getItem("pushNotificationToken");

    if (!token) {
      throw new Error("Device not registered for push notifications");
    }

    // Subscribe via Firebase Admin SDK (backend should implement this)
    // For now, track in AsyncStorage
    const subscriptions = JSON.parse(
      (await AsyncStorage.getItem("pushTopicSubscriptions")) || "[]",
    );
    if (!subscriptions.includes(topic)) {
      subscriptions.push(topic);
      await AsyncStorage.setItem("pushTopicSubscriptions", JSON.stringify(subscriptions));
    }

    console.log(`Subscribed to topic: ${topic}`);
  } catch (err) {
    console.error(`Failed to subscribe to topic ${topic}:`, err);
  }
}

/**
 * Unsubscribe device from notification topic
 * @param {string} topic - Topic name
 */
export async function unsubscribeFromTopic(topic: string): Promise<void> {
  try {
    const subscriptions = JSON.parse(
      (await AsyncStorage.getItem("pushTopicSubscriptions")) || "[]",
    );
    const filtered = subscriptions.filter((t: string) => t !== topic);
    await AsyncStorage.setItem("pushTopicSubscriptions", JSON.stringify(filtered));

    console.log(`Unsubscribed from topic: ${topic}`);
  } catch (err) {
    console.error(`Failed to unsubscribe from topic ${topic}:`, err);
  }
}

/**
 * Set up notification handlers
 * - Handle received notifications while app is in foreground
 * - Handle notification tap/interaction
 */
export function setupNotificationHandlers(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (notification: Notifications.Notification) => void,
) {
  // Handle received notifications in foreground
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log("Notification received:", notification);

      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }

      // Show notification in foreground on iOS
      if (Platform.OS === "ios") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.request.content.title,
            body: notification.request.content.body,
            data: notification.request.content.data,
          },
          trigger: null,
        });
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });

  // Handle notification tap/interaction
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log("Notification tapped:", response);

    if (onNotificationTapped) {
      onNotificationTapped(response.notification);
    }

    // Navigate based on notification data
    const data = response.notification.request.content.data;
    if (data.shipmentId) {
      // Navigate to shipment tracking screen
      // This should be integrated with navigation stack
    }
  });

  // Handle foreground notifications from Firebase
  const messaging = getMessaging(firebaseApp);
  const unsubscribe = onMessage(messaging, (message) => {
    console.log("FCM message received:", message);

    if (message.notification) {
      Notifications.scheduleNotificationAsync({
        content: {
          title: message.notification.title || "",
          body: message.notification.body || "",
          data: (message.data || {}) as Record<string, string>,
        },
        trigger: null,
      });
    }
  });

  return () => {
    subscription.remove();
    unsubscribe();
  };
}
