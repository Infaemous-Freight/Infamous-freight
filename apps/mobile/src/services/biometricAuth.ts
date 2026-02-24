/**
 * Phase 7 Tier 6: Biometric Authentication Service
 *
 * Supports:
 * - Face ID / Face Recognition (iOS)
 * - Touch ID / Fingerprint (iOS/Android)
 * - Fallback to PIN/password
 * - Biometric enrollment check
 * - Transaction confirmation
 */

import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BiometricType {
  faceRecognition: boolean;
  fingerprint: boolean;
  iris: boolean;
}

/**
 * Check device capabilities for biometric authentication
 * @returns {Promise<BiometricType>} Available biometric types
 */
export async function checkBiometricAvailable(): Promise<BiometricType> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      console.warn("Device does not support biometric authentication");
      return {
        faceRecognition: false,
        fingerprint: false,
        iris: false,
      };
    }

    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      faceRecognition: supported.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ),
      fingerprint: supported.includes(LocalAuthentication.AuthenticationType.FINGERPRINT),
      iris: supported.includes(LocalAuthentication.AuthenticationType.IRIS),
    };
  } catch (err) {
    console.error("Failed to check biometric availability:", err);
    return {
      faceRecognition: false,
      fingerprint: false,
      iris: false,
    };
  }
}

/**
 * Check if user is enrolled in biometric authentication
 * @returns {Promise<boolean>} Whether user is enrolled
 */
export async function isBiometricEnrolled(): Promise<boolean> {
  try {
    return await LocalAuthentication.isAvailableAsync();
  } catch (err) {
    console.error("Failed to check biometric enrollment:", err);
    return false;
  }
}

/**
 * Authenticate user with biometrics
 * @param {string} reason - Reason for authentication (shown to user)
 * @returns {Promise<boolean>} Whether authentication succeeded
 */
export async function authenticateWithBiometrics(
  reason: string = "Authenticate",
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false, // Allow fallback to PIN/password
      reason,
      fallbackLabel: "Use passcode",
      disableDeviceFallback: false,
    });

    if (result.success) {
      console.log("✓ Biometric authentication successful");
      await AsyncStorage.setItem("lastBiometricAuth", String(Date.now()));
      return true;
    } else if (result.error === "user_cancel") {
      console.log("Biometric authentication cancelled by user");
    } else {
      console.error("Biometric authentication failed:", result.error);
    }

    return false;
  } catch (err) {
    console.error("Biometric authentication error:", err);
    return false;
  }
}

/**
 * Authenticate for sensitive transaction (with retry logic)
 * @param {string} reason - Transaction reason
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<boolean>} Whether transaction authenticated
 */
export async function authenticateTransaction(
  reason: string,
  maxRetries: number = 3,
): Promise<boolean> {
  let attempts = 0;

  while (attempts < maxRetries) {
    const success = await authenticateWithBiometrics(reason);

    if (success) {
      return true;
    }

    attempts++;

    if (attempts < maxRetries) {
      console.log(`Authentication attempt ${attempts} failed, retrying...`);
      // Wait 1 second before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(`Authentication failed after ${maxRetries} attempts`);
  return false;
}

/**
 * Enable biometric authentication for app
 * @returns {Promise<boolean>} Whether setup succeeded
 */
export async function enableBiometricAuth(): Promise<boolean> {
  try {
    const available = await isBiometricEnrolled();
    if (!available) {
      console.error("Biometric authentication not available on device");
      return false;
    }

    // Test authentication
    const testSuccess = await authenticateWithBiometrics("Enable biometric authentication");

    if (testSuccess) {
      await AsyncStorage.setItem("biometricAuthEnabled", "true");
      console.log("✓ Biometric authentication enabled");
      return true;
    }

    return false;
  } catch (err) {
    console.error("Failed to enable biometric auth:", err);
    return false;
  }
}

/**
 * Disable biometric authentication
 */
export async function disableBiometricAuth(): Promise<void> {
  try {
    await AsyncStorage.removeItem("biometricAuthEnabled");
    console.log("✓ Biometric authentication disabled");
  } catch (err) {
    console.error("Failed to disable biometric auth:", err);
  }
}

/**
 * Check if biometric auth is currently enabled
 * @returns {Promise<boolean>} Whether biometric auth is enabled
 */
export async function isBiometricAuthEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem("biometricAuthEnabled");
    return enabled === "true";
  } catch (err) {
    console.error("Failed to check biometric auth status:", err);
    return false;
  }
}
