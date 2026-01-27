/**
 * Gesture Handlers - 100% User-Friendly
 * Swipe, long-press, pinch-zoom with haptic feedback
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

export interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  haptic?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  haptic = true,
}) => {
  // Pan gesture for swipe detection
  const panGesture = Gesture.Pan().onEnd((event) => {
    const threshold = 50;

    if (event.translationX < -threshold && onSwipeLeft) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onSwipeLeft();
    } else if (event.translationX > threshold && onSwipeRight) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onSwipeRight();
    }
  });

  // Long press gesture
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      onLongPress?.();
    });

  // Combine gestures
  const composed = Gesture.Simultaneous(panGesture, longPressGesture);

  return (
    <GestureDetector gesture={composed}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
};

// Pinch to Zoom Component
export interface PinchZoomProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  haptic?: boolean;
}

export const PinchZoom: React.FC<PinchZoomProps> = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  haptic = true,
}) => {
  const [scale, setScale] = React.useState(1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = Math.min(Math.max(event.scale, minScale), maxScale);
      setScale(newScale);
    })
    .onEnd(() => {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      // Reset scale with animation
      setScale(1);
    });

  return (
    <GestureDetector gesture={pinchGesture}>
      <View style={[styles.container, { transform: [{ scale }] }]}>
        {children}
      </View>
    </GestureDetector>
  );
};

// Haptic Feedback Utilities
export const HapticFeedback = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default { SwipeableItem, PinchZoom, HapticFeedback };
