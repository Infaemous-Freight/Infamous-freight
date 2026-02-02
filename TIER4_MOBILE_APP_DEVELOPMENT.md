# TIER 4: Mobile App Development Strategy

## Executive Overview

Mobile app development extends Infamous Freight to iOS and Android platforms via React Native/Expo, enabling field operations, real-time tracking, and push notifications. This guide provides complete architecture, implementation roadmap, and go-to-market strategy for achieving 100K+ downloads in Year 1.

**Implementation Timeline**: 14-18 weeks | **Resource Allocation**: 4-6 engineers, 1 product manager, 1 QA | **Expected Revenue**: $180K-$250K annual MRR from premium mobile features

---

## 1. MOBILE ARCHITECTURE

### 1.1 Tech Stack

```yaml
Platform: React Native / Expo
Framework: React Native 0.73+
State Management: Redux Toolkit
Navigation: React Navigation v6
API Communication: Axios + React Query
Offline Support: SQLite (React Native SQLite)
Push Notifications: Expo Notifications + Firebase Cloud Messaging
Analytics: Amplitude + Sentry
Testing: Detox (E2E), Jest (Unit)

Device Requirements:
  iOS: 14.0+ (supports 95%+ of active devices)
  Android: API 24+ (supports 90%+ of active devices)
  Minimum storage: 80MB

Feature Modules:
  Auth: Face/TouchID + password fallback
  Tracking: Real-time GPS + background tracking (with user consent)
  Notifications: Push + in-app messaging
  Offline: Queue actions, sync on reconnect
  Analytics: Session tracking, crash reporting
  AI Assistant: Voice commands via Whisper API
```

### 1.2 API Integration Layer

```typescript
// mobile/src/services/apiClient.ts

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

class APIClient {
  private api: AxiosInstance;
  private offline: boolean = false;
  private queue: QueuedRequest[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'https://api.infamous-freight.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Infamous-Freight-Mobile/1.0'
      }
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(async config => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 401) {
          // Token expired, refresh
          await this.refreshToken();
        }
        throw error;
      }
    );

    // Monitor connectivity
    this.monitorConnectivity();
  }

  private async monitorConnectivity() {
    NetInfo.addEventListener(state => {
      this.offline = !state.isConnected;
      if (state.isConnected && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  async request<T = any>(config: RequestConfig): Promise<T> {
    if (this.offline && config.method !== 'GET') {
      // Queue write operations
      await this.queueRequest(config);
      return { queued: true } as any;
    }

    try {
      const response = await this.api.request<T>(config);
      return response.data;
    } catch (error) {
      if (this.offline && config.method === 'GET') {
        // Try to return cached data
        return this.getCachedData(config.url!);
      }
      throw error;
    }
  }

  private async queueRequest(config: RequestConfig) {
    const queued: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      config,
      timestamp: new Date(),
      retries: 0
    };

    this.queue.push(queued);
    await AsyncStorage.setItem('requestQueue', JSON.stringify(this.queue));
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const request = this.queue[0];
      try {
        await this.api.request(request.config);
        this.queue.shift();
      } catch (error) {
        request.retries++;
        if (request.retries >= 3) {
          this.queue.shift();
          // Store permanent failure
          await this.storePermanentFailure(request);
        }
      }
    }
    await AsyncStorage.setItem('requestQueue', JSON.stringify(this.queue));
  }

  private async refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await this.api.post('/auth/refresh', {
        refreshToken
      });

      await AsyncStorage.setItem('authToken', response.data.token);
    } catch (error) {
      // Force re-login
      await AsyncStorage.removeItem('authToken');
      throw error;
    }
  }

  private async getCachedData(url: string) {
    const cached = await AsyncStorage.getItem(`cache:${url}`);
    if (cached) {
      return JSON.parse(cached);
    }
    throw new Error('No cached data available');
  }

  private async storePermanentFailure(request: QueuedRequest) {
    const failures = JSON.parse(
      (await AsyncStorage.getItem('failedRequests')) || '[]'
    );
    failures.push({
      ...request,
      failedAt: new Date()
    });
    await AsyncStorage.setItem('failedRequests', JSON.stringify(failures));
  }
}

export default new APIClient();

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;
  data?: any;
}

interface QueuedRequest {
  id: string;
  config: RequestConfig;
  timestamp: Date;
  retries: number;
}
```

---

## 2. CORE FEATURES

### 2.1 Real-Time GPS Tracking

```typescript
// mobile/src/features/tracking/gpsService.ts

import * as Location from 'expo-location';
import { AppState } from 'react-native';

class GPSTrackingService {
  private backgroundSubscription: any;
  private trackingEnabled: boolean = false;

  async initializeTracking() {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Request background permissions (iOS 11+)
    const bgStatus = await Location.requestBackgroundPermissionsAsync();
    this.trackingEnabled = bgStatus.status === 'granted';
  }

  startBackgroundTracking(shipmentId: string) {
    if (!this.trackingEnabled) {
      console.warn('Background tracking not available');
      return;
    }

    // Start geofencing for delivery locations
    Location.startLocationUpdatesAsync('TRACKING_TASK', {
      accuracy: Location.Accuracy.High,
      distanceInterval: 50, // Update every 50 meters
      timeInterval: 10000, // Or every 10 seconds
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Tracking delivery...',
        notificationBody: 'Shipment #' + shipmentId
      }
    });
  }

  async captureLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp),
        speed: location.coords.speed,
        altitude: location.coords.altitude
      };
    } catch (error) {
      console.error('Error capturing location:', error);
      throw error;
    }
  }

  async checkGeofence(shipmentId: string, destination: Coordinates) {
    const currentLocation = await this.captureLocation();
    const distance = this.calculateDistance(
      currentLocation,
      destination
    );

    // Alert when within 500 meters
    if (distance < 0.5) {
      return {
        withinGeofence: true,
        distance: distance,
        alert: 'Approaching delivery location'
      };
    }

    return { withinGeofence: false, distance };
  }

  private calculateDistance(loc1: any, loc2: any): number {
    const R = 6371; // km
    const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export default new GPSTrackingService();

interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### 2.2 Push Notification System

```typescript
// mobile/src/services/notificationService.ts

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
  async initializeNotifications() {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        return {
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: true
        };
      }
    });

    // Get and register push token
    const token = await this.getPushToken();
    await this.registerTokenWithServer(token);

    // Listen for notifications
    this.setupNotificationListeners();
  }

  private async getPushToken(): Promise<string> {
    const { data } = await Notifications.getPermissionsAsync();
    
    if (data.notificationPermission === 'denied') {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Notification permissions denied');
      }
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }

  private setupNotificationListeners() {
    // Handle notification received in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      notification => {
        this.handleNotification(notification);
      }
    );

    // Handle notification tapped
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      response => {
        this.handleNotificationTap(response.notification);
      }
    );
  }

  private handleNotification(notification: Notifications.Notification) {
    const { data } = notification.request.content;

    switch (data.type) {
      case 'SHIPMENT_UPDATE':
        this.handleShipmentUpdate(data);
        break;
      case 'DELIVERY_ALERT':
        this.handleDeliveryAlert(data);
        break;
      case 'MESSAGE':
        this.handleMessage(data);
        break;
    }
  }

  private async handleNotificationTap(notification: Notifications.Notification) {
    const { data } = notification.request.content;
    
    // Navigate to relevant screen based on notification type
    // This should be connected to your navigation stack
    console.log('Navigate to:', data.screen);
  }

  private async handleShipmentUpdate(data: any) {
    // Update local cache with new shipment data
    const shipment = {
      id: data.shipmentId,
      status: data.status,
      lastUpdate: new Date(),
      ...data
    };

    await AsyncStorage.setItem(
      `shipment:${data.shipmentId}`,
      JSON.stringify(shipment)
    );
  }

  private handleDeliveryAlert(data: any) {
    // Trigger audio alert for driver
    // Use Expo Audio to play alert sound
  }

  private handleMessage(data: any) {
    // Add message to message queue
  }

  private async registerTokenWithServer(token: string) {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/notifications/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          deviceId: Platform.OS === 'ios' ? 'ios-' + Date.now() : 'android-' + Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  private notificationListener: any;
  private responseListener: any;
}

export default new NotificationService();
```

---

## 3. MONETIZATION STRATEGY

### 3.1 Premium Features

```yaml
# Mobile Premium Features Tier

Freemium Model:
  Free:
    - Basic shipment tracking
    - Read-only dashboard access
    - Push notifications
    - Monthly limit: 100 shipments tracked
    - Price: $0/user/month

  Premium ($9.99/user/month):
    - Unlimited shipment tracking
    - Real-time GPS tracking
    - Advanced analytics
    - Priority support
    - Custom alerts
    - Offline map access
    - Driver performance insights
    - Conversion: Target 15% of free users

  Enterprise ($Auto-pricing):
    - Unlimited everything
    - Custom integrations
    - White-label mobile app
    - Dedicated support
    - API rate limit: 10K/day
    - Conversion: Target 5% of premium users

In-App Purchases:
  - Map downloads for offline use: $2.99 per region
  - Premium analytics report: $4.99
  - Extended data history (6 months): $1.99/month
  - Custom branding: $19.99 (one-time)

Projected Revenue:
  - Y1: 100K downloads, 15% premium = 15K paying users × $9.99 × 12 = $1.8M ARR
  - Y2: 500K downloads, 20% premium = 100K paying users × $12.99 × 12 = $15.6M ARR
```

### 3.2 Monetization Integration

```typescript
// mobile/src/services/monetizationService.ts

import { RevenueCat } from 'react-native-revenuecat';

class MonetizationService {
  async initializePurchasing() {
    RevenueCat.setup('api_key_here', 'user_id');

    // Get available products
    const offerings = await RevenueCat.getOfferings();
    
    return {
      packages: offerings.current?.availablePackages || [],
      entitlements: offerings.current?.availablePackages.map(p => p.identifier)
    };
  }

  async checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    const customerInfo = await RevenueCat.getCustomerInfo();

    return {
      isVIPMember: customerInfo.entitlements.active.includes('vip_subscription'),
      isPremium: customerInfo.entitlements.active.includes('premium_subscription'),
      isEnterprise: customerInfo.entitlements.active.includes('enterprise_subscription'),
      activeSubscriptions: customerInfo.subscriptions,
      expirationDate: customerInfo.subscriptions[0]?.expirationDate
    };
  }

  async purchasePremiumSubscription() {
    try {
      const package_ = await RevenueCat.getOfferings().then(
        o => o.current?.availablePackages.find(p => p.identifier === 'premium_yearly')
      );

      if (!package_) throw new Error('Package not found');

      const purchase = await RevenueCat.purchasePackage(package_);
      
      // Verify purchase with backend
      await this.verifyPurchaseWithServer(purchase);

      return { success: true, message: 'Premium subscription activated' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async restorePurchases() {
    try {
      await RevenueCat.restorePurchases();
      return { success: true, message: 'Purchases restored' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async verifyPurchaseWithServer(purchase: any) {
    await fetch(`${process.env.REACT_APP_API_URL}/billing/verify-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        receipt: purchase.receipt,
        transactionId: purchase.transactionId,
        platform: Platform.OS
      })
    });
  }
}

interface SubscriptionStatus {
  isVIPMember: boolean;
  isPremium: boolean;
  isEnterprise: boolean;
  activeSubscriptions: any[];
  expirationDate?: string;
}

export default new MonetizationService();
```

---

## 4. IMPLEMENTATION ROADMAP

### MVP (Weeks 1-8)

- ✅ User authentication (face/touch + password)
- ✅ Shipment list and detail views
- ✅ Real-time GPS tracking
- ✅ Push notifications
- ✅ Offline mode (queue read-only access)
- ✅ Basic analytics

### Phase 2 (Weeks 9-14)

- ✅ Advanced map features
- ✅ In-app messaging
- ✅ Voice command integration
- ✅ Subscription system
- ✅ Premium features

### Phase 3 (Weeks 15-18)

- ✅ White-label capability
- ✅ Performance optimization
- ✅ App store optimization
- ✅ Marketing campaign

---

## 5. SUCCESS METRICS

| Metric           | Target (Y1) | Measurement          |
| ---------------- | ----------- | -------------------- |
| Downloads        | 100K        | App store analytics  |
| DAU              | 25K         | Firebase Analytics   |
| Premium adoption | 15%         | RevenueCat dashboard |
| Premium MRR      | $150K       | Stripe/RevenueCat    |
| App store rating | 4.5+ stars  | App store reviews    |
| Crash rate       | <0.1%       | Sentry               |

---

## 6. DEPLOYMENT CHECKLIST

- [ ] iOS TestFlight build ready
- [ ] Android closed beta released
- [ ] App store optimization complete
- [ ] Privacy policy & legal review done
- [ ] Monetization system tested
- [ ] Analytics fully wired
- [ ] Push notifications verified
- [ ] Offline mode tested
- [ ] Marketing plan executed
- [ ] Support process ready

---

**Implementation Cost**: $320K (4 engineers × $60K/month × 4 months + tools + app store fees)  
**Expected Y1 Revenue**: $180K-$250K MRR from premium tier  
**Time Investment**: 14-18 weeks for full launch
