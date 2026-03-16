# App Store Optimization (ASO) Guide

# Maximize app visibility and downloads on iOS App Store and Google Play

## 🎯 App Store Optimization Strategy

### 1. App Store Connect (iOS) Configuration

#### App Name (30 characters max)

```
Infæmous Freight - Track Shipments
```

**Keywords**: Freight, Track, Shipments **Character count**: 38 → Optimize to:
"Infæmous Freight Tracking"

#### Subtitle (30 characters max)

```
Real-time Package Tracking
```

**Keywords**: Real-time, Package, Tracking **Character count**: 29 ✓

#### Keywords (100 characters max)

```
freight,cargo,shipment,tracking,logistics,delivery,package,transport,driver,real-time
```

**Optimization tips**:

- No spaces after commas (save characters)
- Include competitor keywords
- Use singular form (plural auto-included)
- Avoid brand names

#### Description (4000 characters max)

```
Track your shipments in real-time with Infæmous Freight, the #1 freight management app.

✅ FEATURES
• Real-time GPS tracking
• Push notifications for status updates
• Offline mode for drivers
• Photo documentation
• Driver performance analytics
• Multi-language support

🚚 FOR DRIVERS
• Turn-by-turn navigation
• Proof of delivery capture
• Route optimization
• Earnings tracking

📦 FOR CUSTOMERS
• Live shipment tracking
• Estimated delivery times
• Shipment history
• Customer support chat

⭐ WHY CHOOSE US
• 99.9% uptime reliability
• Enterprise-grade security
• 24/7 customer support
• Free tier available

Perfect for:
- Freight companies
- Logistics coordinators
- Delivery drivers
- Supply chain managers

Download now and experience seamless freight tracking!
```

### 2. Google Play Console Configuration

#### Short Description (80 characters max)

```
Track freight shipments in real-time with GPS and push notifications
```

#### Full Description (4000 characters max)

(Same as iOS description above)

#### Promo Text (170 characters max)

```
NEW: Offline mode for drivers! Track shipments even without internet connection. Download now for seamless freight management.
```

### 3. Screenshots Strategy

#### Required Sizes

**iOS**:

- iPhone 6.7" (1290 x 2796 px) - iPhone 14 Pro Max
- iPhone 6.5" (1242 x 2688 px) - iPhone 11 Pro Max
- iPad Pro 12.9" (2048 x 2732 px)

**Android**:

- Phone (1080 x 1920 px minimum)
- Tablet (1200 x 1920 px minimum)
- Feature Graphic (1024 x 500 px)

#### Screenshot Template

```bash
# Generate screenshots with captions
npm install -g app-store-screenshots

# Create templates
app-store-screenshots create \
  --template freight-tracking \
  --sizes "6.7,6.5,12.9" \
  --output ./screenshots
```

#### Screenshot Order (5-10 screenshots)

1. **Dashboard** - "Track all your shipments in one place"
2. **Real-time Map** - "Live GPS tracking with ETA"
3. **Notifications** - "Instant status updates"
4. **Proof of Delivery** - "Photo documentation"
5. **Driver Analytics** - "Performance insights"
6. **Offline Mode** - "Works without internet"

#### Screenshot Automation Script

```typescript
// scripts/generate-screenshots.ts
import Fastlane from "fastlane";
import { devices } from "react-native-device-info";

async function generateScreenshots() {
  const scenarios = [
    { screen: "Dashboard", caption: "Track all shipments" },
    { screen: "Map", caption: "Real-time GPS tracking" },
    { screen: "Notifications", caption: "Instant updates" },
    { screen: "ProofOfDelivery", caption: "Photo documentation" },
    { screen: "Analytics", caption: "Performance insights" },
  ];

  for (const device of ["iPhone 14 Pro Max", "Pixel 6 Pro"]) {
    for (const scenario of scenarios) {
      await Fastlane.snapshot({
        device,
        screen: scenario.screen,
        output: `./screenshots/${device}/${scenario.screen}.png`,
      });
    }
  }
}
```

### 4. App Preview Video

#### Requirements

- **Length**: 15-30 seconds
- **Format**: MOV or MP4
- **Resolution**: 1920 x 1080 (landscape) or 1080 x 1920 (portrait)
- **File size**: < 500 MB

#### Video Script (30 seconds)

```
[0-5s]  App icon animation + "Infæmous Freight"
[5-10s] Dashboard showing multiple shipments
[10-15s] Map with real-time tracking
[15-20s] Push notification animation
[20-25s] Driver capturing proof of delivery
[25-30s] "Download now" CTA
```

#### Video Generation

```bash
# Using ffmpeg
ffmpeg -i screenshots/dashboard.png -i screenshots/map.png \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0" \
  -t 30 app-preview.mp4
```

### 5. Ratings & Reviews Optimization

#### In-App Rating Prompt

```typescript
// src/services/app-rating.ts
import { Alert, Linking } from "react-native";
import Rate from "react-native-rate";

export async function requestRating() {
  const usageCount = await AsyncStorage.getItem("app_usage_count");

  // Ask after 10 uses
  if (parseInt(usageCount) === 10) {
    Rate.rate({
      AppleAppID: "123456789",
      GooglePackageName: "com.infamousfreight",
      preferInApp: true,
      openAppStoreIfInAppFails: true,
    });
  }
}
```

#### Review Response Template

```
Thank you for your feedback! We're constantly improving Infæmous Freight.
[If positive]: We're thrilled you love our app! 🚚
[If negative]: We'd love to make this right. Please contact support@infamousfreight.com
```

### 6. Localization

#### Priority Markets

1. English (US, UK, AU)
2. Spanish (Mexico, Spain)
3. French (France, Canada)
4. German
5. Portuguese (Brazil)

#### Localized Keywords (Spanish)

```
transporte,carga,envío,rastreo,logística,entrega,paquete,conductor,tiempo-real
```

### 7. Conversion Rate Optimization

#### A/B Testing Plan

```typescript
// Test variants
const variants = {
  iconA: require("./icon-blue.png"),
  iconB: require("./icon-red.png"),
  screenshotsA: ["dashboard", "map", "tracking"],
  screenshotsB: ["map", "dashboard", "delivery"],
};

// Track install attribution
import analytics from "@react-native-firebase/analytics";

analytics().logEvent("app_store_impression", {
  variant: "A",
  source: "search",
});
```

### 8. Metadata Automation

#### Fastlane Configuration

```ruby
# fastlane/Fastfile
lane :update_metadata do
  deliver(
    app_identifier: "com.infamousfreight",
    metadata_path: "./metadata",
    screenshots_path: "./screenshots",
    skip_binary_upload: true,
    skip_screenshots: false,
    force: true
  )
end

lane :upload_screenshots do
  snapshot(
    devices: [
      "iPhone 14 Pro Max",
      "iPhone 11 Pro Max",
      "iPad Pro (12.9-inch)"
    ],
    languages: ["en-US", "es-MX"],
    output_directory: "./screenshots"
  )
end
```

### 9. Category Selection

#### Primary Category

- **iOS**: Navigation
- **Android**: Maps & Navigation

#### Secondary Category

- **iOS**: Business
- **Android**: Business

### 10. Performance Monitoring

#### App Store Analytics Tracking

```typescript
// Track sources
import { AppState } from 'react-native';
import Branch from 'react-native-branch';

Branch.subscribe(({ error, params }) => {
  if (params?.'+clicked_branch_link') {
    analytics().logEvent('install_attribution', {
      source: params.~channel,
      campaign: params.~campaign,
    });
  }
});
```

### 11. Feature Graphic (Android)

#### Template

```typescript
// 1024 x 500 px
const featureGraphic = {
  background: "#1a73e8", // Brand blue
  title: "Infæmous Freight",
  subtitle: "Real-time Shipment Tracking",
  screenshot: "map-tracking.png",
  devices: ["phone", "tablet"],
};
```

### 12. What's New (Release Notes)

#### Template

```
🎉 What's New in v2.5.0

✨ NEW FEATURES
• Offline mode for drivers
• Multi-language support (5 languages)
• Dark mode

🐛 BUG FIXES
• Improved GPS accuracy
• Fixed push notification delay
• Faster app startup

🚀 IMPROVEMENTS
• 30% faster map loading
• Better battery optimization
• Enhanced security

Thank you for using Infæmous Freight! 🚚
```

## 📊 ASO Checklist

### Pre-Launch

- [ ] App name optimized (< 30 chars)
- [ ] Keywords researched and optimized
- [ ] Description written (with keywords)
- [ ] Screenshots generated (5-10)
- [ ] App preview video created
- [ ] Icon tested (A/B variants)
- [ ] Localization complete (3+ languages)
- [ ] Metadata submitted via Fastlane

### Post-Launch

- [ ] Monitor daily rankings
- [ ] Respond to reviews within 24h
- [ ] A/B test icon and screenshots
- [ ] Update keywords monthly
- [ ] Track conversion rate
- [ ] Request ratings in-app
- [ ] Feature in App Store (submit request)

### Ongoing Optimization

- [ ] Weekly ranking check
- [ ] Monthly keyword refresh
- [ ] Quarterly screenshot update
- [ ] Seasonal promotions
- [ ] Competitor monitoring

## 🎯 Expected Results

### Baseline (No ASO)

- Organic installs: 50/day
- Conversion rate: 15%
- Keyword rankings: 200+

### With ASO Optimization

- Organic installs: 200/day (+300%)
- Conversion rate: 30% (+100%)
- Keyword rankings: Top 20

## 🛠️ Tools

- **Keyword Research**: AppTweak, Sensor Tower, App Annie
- **Screenshot Generator**: Fastlane Snapshot, Shots
- **A/B Testing**: SplitMetrics, StoreMaven
- **Analytics**: App Store Connect, Google Play Console
- **Automation**: Fastlane, Bitrise

## 📚 Resources

- [iOS App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Listing](https://play.google.com/console/about/storelisting/)
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [ASO Best Practices](https://www.apptentive.com/blog/app-store-optimization/)
