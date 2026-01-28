import React from "react";
import { Pressable, View, Text } from "react-native";
import { GodTheme } from "../theme/godTheme";
import { useCommandMode } from "../hooks/useCommandMode";

export function CommandSurface() {
  const { commandMode, toggle } = useCommandMode();

  return (
    <Pressable
      onLongPress={toggle}
      delayLongPress={700}
      style={{ flex: 1, backgroundColor: GodTheme.colors.void }}
    >
      <View
        style={{
          margin: 16,
          padding: 16,
          borderRadius: GodTheme.radius,
          backgroundColor: GodTheme.colors.panel,
          borderWidth: 1,
          borderColor: GodTheme.colors.stroke,
        }}
      >
        <Text style={{ color: GodTheme.colors.ember, letterSpacing: 1.6, fontSize: 12 }}>
          {commandMode ? "COMMAND MODE: ON" : "COMMAND MODE: OFF"}
        </Text>
      </View>
    </Pressable>
  );
}
