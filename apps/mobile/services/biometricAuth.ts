/**
 * Biometric Authentication Service
 * Handles Face ID / Touch ID / Fingerprint authentication
 */

import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_ENABLED_KEY = "@biometric_enabled";

export class BiometricAuthService {
  private isAvailable = false;
  private supportedTypes: number[] = [];

  async initialize(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return false;
      }

      this.supportedTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      this.isAvailable = true;

      return true;
    } catch (error) {
      console.error("Biometric initialization failed:", error);
      return false;
    }
  }

  async authenticate(reason?: string): Promise<boolean> {
    if (!this.isAvailable) {
      throw new Error("Biometric authentication not available");
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || "Authenticate to access the app",
        fallbackLabel: "Use passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error("Biometric authentication failed:", error);
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === "true";
    } catch (error) {
      return false;
    }
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        BIOMETRIC_ENABLED_KEY,
        enabled ? "true" : "false",
      );
    } catch (error) {
      console.error("Failed to save biometric preference:", error);
    }
  }

  getBiometricType(): string {
    if (
      this.supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      )
    ) {
      return "Face ID";
    } else if (
      this.supportedTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      )
    ) {
      return "Touch ID / Fingerprint";
    } else if (
      this.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
    ) {
      return "Iris Recognition";
    }
    return "Biometric";
  }

  isSupported(): boolean {
    return this.isAvailable;
  }
}

export const biometricAuth = new BiometricAuthService();
