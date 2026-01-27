/**
 * React Native Button Component - 100% User-Friendly
 * Mobile-optimized with haptic feedback
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
  haptic = true,
}) => {
  const handlePress = async () => {
    if (haptic && !disabled && !loading) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: "#0066CC",
    },
    secondary: {
      backgroundColor: "#6F42C1",
    },
    tertiary: {
      backgroundColor: "transparent",
      borderWidth: 2,
      borderColor: "#0066CC",
    },
    danger: {
      backgroundColor: "#DC3545",
    },
  };

  const variantTextStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: "#FFFFFF" },
    secondary: { color: "#FFFFFF" },
    tertiary: { color: "#0066CC" },
    danger: { color: "#FFFFFF" },
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    md: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    lg: {
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
  };

  const sizeTextStyles: Record<ButtonSize, TextStyle> = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "tertiary" ? "#0066CC" : "#FFFFFF"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantTextStyles[variant],
            sizeTextStyles[size],
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
  },
});

export default Button;
