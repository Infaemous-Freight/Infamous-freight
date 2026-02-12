# Infamous Freight Mobile

React Native mobile application for the Infamous Freight platform using Expo.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.15.0
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm start
```

### Running on Device

```bash
# iOS Simulator (Mac only)
pnpm ios

# Android Emulator
pnpm android

# Expo Go app (scan QR code)
pnpm start
```

## 📁 Project Structure

```
apps/mobile/
├── src/
│   ├── components/     # Reusable React Native components
│   ├── navigation/     # Navigation configuration
│   └── theme/         # Theme and styling
├── services/          # API and external services
├── App.tsx            # Application entry point
├── app.json           # Expo configuration
└── package.json
```

## 🛠️ Key Features

- **React Native**: Cross-platform mobile development
- **Expo**: Simplified development and deployment
- **TypeScript**: Full type safety
- **Shared Types**: Import types from `@infamous-freight/shared`
- **Navigation**: React Navigation
- **State Management**: (To be implemented)

## 🧪 Testing

### Adding Tests

Install testing dependencies:

```bash
pnpm add -D @testing-library/react-native jest-expo
```

Configure Jest in `package.json`:

```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

Example test:

```typescript
import { render } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button>Press me</Button>);
    expect(getByText('Press me')).toBeTruthy();
  });
});
```

### Running Tests

```bash
pnpm test
```

## 🎨 Styling

- StyleSheet for component styles
- Theme system in `src/theme/`
- Responsive design with Dimensions API

Example:

```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  }
});
```

## 🔧 Environment Variables

See `.env.example` for required variables:

- `EXPO_PUBLIC_API_URL`: Backend API URL
- `EXPO_PUBLIC_STRIPE_KEY`: Stripe publishable key

**Important**: Expo variables must be prefixed with `EXPO_PUBLIC_`.

## 📱 Navigation

Using React Navigation:

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 🌐 API Integration

```typescript
import type { ApiResponse, Shipment } from '@infamous-freight/shared';

async function fetchShipments(): Promise<ApiResponse<Shipment[]>> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/shipments`);
  return response.json();
}
```

## 🎯 Type Safety with Shared Package

```typescript
import type { Shipment } from '@infamous-freight/shared';
import { SHIPMENT_STATUSES } from '@infamous-freight/shared';

interface Props {
  shipment: Shipment;
}

export function ShipmentCard({ shipment }: Props) {
  const isDelivered = shipment.status === SHIPMENT_STATUSES.DELIVERED;
  // ...
}
```

## 📦 Build & Deploy

### Development Build

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Production Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android

# Both
eas build --profile production --platform all
```

### Submit to Stores

```bash
# iOS App Store
eas submit -p ios

# Google Play Store
eas submit -p android
```

## 🔍 Debugging

### React Native Debugger

```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Enable debugging in app
# Shake device → "Debug" → "Debug JS Remotely"
```

### Expo DevTools

```bash
# Start with DevTools
pnpm start

# Open in browser
# Press 'd' in terminal
```

### Console Logs

View logs in terminal:

```bash
# iOS
pnpm ios --reset-cache

# Android
pnpm android --reset-cache
```

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes with proper types
3. Test on both iOS and Android
4. Ensure no type errors: `tsc --noEmit`
5. Create a PR with conventional commit messages

## 🔧 Common Issues

### "Cannot find module '@infamous-freight/shared'"

Build the shared package first:

```bash
cd ../packages/shared && pnpm build
```

### Metro bundler issues

Clear cache:

```bash
pnpm start --clear
```

### iOS build errors

```bash
cd ios && pod install && cd ..
pnpm ios
```

### Android build errors

```bash
cd android && ./gradlew clean && cd ..
pnpm android
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [React Navigation](https://reactnavigation.org)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 📄 License

Proprietary - Copyright © 2025 Infæmous Freight. All Rights Reserved.
