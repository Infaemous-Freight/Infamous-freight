/**
 * Mobile App: Test Setup
 *
 * Configures Jest environment for React Native and Expo testing:
 * - Mocks Expo APIs
 * - Mocks React Native modules
 * - Mocks async storage
 * - Mocks navigation
 * - Configures custom matchers
 */

import "@testing-library/jest-native/extend-expect";

// Mock Expo modules
jest.mock("expo", () => ({
  ...jest.requireActual("expo"),
  SplashScreen: {
    hideAsync: jest.fn(),
    hide: jest.fn(),
  },
  Updates: {
    reloadAsync: jest.fn(),
  },
  logging: {
    LogLevel: {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    },
  },
}));

// Mock Expo Storage
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock React Native AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  getAllKeys: jest.fn().mockResolvedValue([]),
  clear: jest.fn().mockResolvedValue(undefined),
}));

// Mock Navigation
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
    name: "MockRoute",
  }),
}));

jest.mock("@react-navigation/stack", () => ({
  createStackNavigator: () => ({
    Navigator: () => null,
    Screen: () => null,
  }),
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({
    Navigator: () => null,
    Screen: () => null,
  }),
}));

// Mock React Native modules
jest.mock("react-native", () => {
  const actual = jest.requireActual("react-native");
  return {
    ...actual,
    Platform: {
      OS: "ios",
      select: (obj: any) => obj.ios,
    },
    Animated: {
      ...actual.Animated,
      timing: jest.fn(() => ({ start: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn() })),
    },
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    Appearance: {
      getColorScheme: jest.fn(() => "light"),
      addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    Linking: {
      openURL: jest.fn(),
      openSettings: jest.fn(),
    },
  };
});

// Mock DeviceStorage
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  useWindowDimensions: () => ({
    width: 375,
    height: 812,
  }),
}));

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: "wifi",
  }),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock Device Info
jest.mock("expo-device", () => ({
  deviceYear: 2024,
  modelName: "iPhone 15",
  brand: "Apple",
  osVersion: "18.0",
  getDeviceTypeAsync: jest.fn().mockResolvedValue("phone"),
}));

// Mock permissions
jest.mock("expo-permissions", () => ({
  getAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  askAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
  }),
) as jest.Mock;

// Mock custom matchers for testing
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
    };
  },
  toBeValidPhone(received: string) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const pass = phoneRegex.test(received.replace(/\D/g, ""));
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid phone number`
          : `Expected ${received} to be a valid phone number`,
    };
  },
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Non-serializable values were found in the navigation state")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Type augmentation for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidPhone(): R;
    }
  }
}
