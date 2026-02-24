/**
 * Phase 7 Tier 6: Mobile App Initialization
 *
 * Initializes all Tier 6 services:
 * - Push notifications
 * - Offline sync
 * - Biometric auth
 * - Background location tracking
 * - Camera permissions
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  registerForPushNotifications,
  setupNotificationHandlers,
  subscribeToTopic,
} from "./services/pushNotifications";
import { initializeOfflineSync } from "./services/offlineSync";
import { enableBiometricAuth, isBiometricAuthEnabled } from "./services/biometricAuth";
import {
  startBackgroundLocationTracking,
  requestBackgroundLocationPermission,
} from "./services/backgroundLocation";
import { requestCameraPermission, requestGalleryPermission } from "./services/cameraService";

/**
 * Initialize all Phase 7 Tier 6 services
 */
export async function initializePhase7Tier6() {
  try {
    console.log("🚀 Initializing Phase 7 Tier 6 (Mobile Enhancements)...");

    // 1. Initialize push notifications
    try {
      await registerForPushNotifications();
      setupNotificationHandlers(
        (notification) => {
          console.log("Notification received:", notification);
        },
        (notification) => {
          console.log("Notification tapped:", notification);
        },
      );

      // Subscribe to topics
      await subscribeToTopic("shipment-updates");
      await subscribeToTopic("alerts");
      console.log("✓ Push notifications initialized");
    } catch (err) {
      console.warn("⚠ Push notifications initialization failed:", err);
    }

    // 2. Initialize offline sync
    try {
      await initializeOfflineSync();
      console.log("✓ Offline sync initialized");
    } catch (err) {
      console.warn("⚠ Offline sync initialization failed:", err);
    }

    // 3. Initialize biometric auth (optional)
    try {
      const bioAuthEnabled = await isBiometricAuthEnabled();
      if (!bioAuthEnabled) {
        // Don't force - let user decide
        console.log("ℹ Biometric auth available but not enabled");
      } else {
        console.log("✓ Biometric auth enabled");
      }
    } catch (err) {
      console.warn("⚠ Biometric auth check failed:", err);
    }

    // 4. Request background location permissions
    try {
      const granted = await requestBackgroundLocationPermission();
      if (granted) {
        console.log("✓ Background location permission granted");
        // Don't auto-start - let user enable from settings
      } else {
        console.log("ℹ Background location permission not granted");
      }
    } catch (err) {
      console.warn("⚠ Background location permission request failed:", err);
    }

    // 5. Request camera and gallery permissions
    try {
      await requestCameraPermission();
      await requestGalleryPermission();
      console.log("✓ Camera and gallery permissions granted");
    } catch (err) {
      console.warn("⚠ Camera/gallery permission request failed:", err);
    }

    console.log("✅ Phase 7 Tier 6 initialization complete");
  } catch (err) {
    console.error("❌ Failed to initialize Phase 7 Tier 6:", err);
    throw err;
  }
}

/**
 * Cleanup services (called on app exit)
 */
export async function cleanupPhase7Tier6() {
  try {
    console.log("🧹 Cleaning up Phase 7 Tier 6 services...");

    // Services will clean up themselves on app exit
    // This is just a placeholder for future cleanup logic

    console.log("✅ Cleanup complete");
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  }
}
