/**
 * Dark Mode Theme Provider - 100% User-Friendly
 * System preference detection with smooth transitions
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme, Appearance } from "react-native";

export type Theme = "light" | "dark";

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

const lightTheme: ThemeColors = {
  primary: "#0066CC",
  secondary: "#6F42C1",
  background: "#FFFFFF",
  surface: "#F8F9FA",
  text: "#212529",
  textSecondary: "#6C757D",
  border: "#DEE2E6",
  error: "#DC3545",
  success: "#28A745",
  warning: "#FFC107",
  info: "#17A2B8",
};

const darkTheme: ThemeColors = {
  primary: "#3399FF",
  secondary: "#9966FF",
  background: "#121212",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  border: "#333333",
  error: "#FF6B6B",
  success: "#4CAF50",
  warning: "#FFB74D",
  info: "#4FC3F7",
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(
    systemColorScheme === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === "dark" ? "dark" : "light");
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colors = theme === "dark" ? darkTheme : lightTheme;
  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
