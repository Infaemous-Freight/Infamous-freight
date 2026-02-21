# Firebase Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Firebase Project Setup
- [ ] Created Firebase project in console
- [ ] Project ID configured in `.firebaserc`
- [ ] Service account JSON downloaded
- [ ] Service account stored securely (not in git)
- [ ] Environment variables configured in `.env`

### 2. Services Enabled
- [ ] Authentication enabled
- [ ] Cloud Firestore enabled (Production mode)
- [ ] Cloud Storage enabled
- [ ] Cloud Messaging enabled
- [ ] Cloud Functions enabled (if needed)

### 3. Security Rules Deployed
- [ ] Firestore rules deployed (`firestore.rules`)
- [ ] Storage rules deployed (`storage.rules`)
- [ ] Firestore indexes deployed (`firestore.indexes.json`)
- [ ] Rules tested in Firebase Console

### 4. Mobile App Configuration
- [ ] iOS app added to Firebase project
- [ ] `GoogleService-Info.plist` downloaded
- [ ] Android app added to Firebase project
- [ ] `google-services.json` downloaded
- [ ] Bundle IDs/Package names match

### 5. iOS APNs Setup
- [ ] Apple Developer account active
- [ ] APNs Authentication Key created
- [ ] .p8 file downloaded and stored securely
- [ ] APNs key uploaded to Firebase Console
- [ ] Team ID and Key ID documented
- [ ] iOS app has Push Notifications capability

### 6. Testing Complete
- [ ] Firestore read/write tested
- [ ] Push notifications tested on iOS
- [ ] Push notifications tested on Android
- [ ] Storage upload/download tested
- [ ] Authentication flow tested
- [ ] API endpoints tested

### 7. Monitoring & Alerts
- [ ] Alert rules configured
- [ ] Notification channels set up (email, Slack)
- [ ] Monitoring dashboard created
- [ ] Log-based metrics configured
- [ ] Cost alerts configured

### 8. Documentation
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Deployment process documented
- [ ] Troubleshooting guide available

## 🚀 Deployment Steps

### Step 1: Verify Installation
```bash
./scripts/verify-firebase.sh
```
Expected: ✓ All required files present and configured

### Step 2: Run Production Setup
```bash
./scripts/setup-firebase-production.sh
```
This will:
- Authenticate with Firebase
- Set active project
- Deploy security rules
- Guide through credential setup

### Step 3: Configure iOS (if applicable)
```bash
./scripts/configure-ios-apns.sh
```
This will guide through APNs certificate setup

### Step 4: Setup Monitoring
```bash
./scripts/setup-firebase-monitoring.sh
```
This will create alert rules and dashboards

### Step 5: Test Everything
```bash
./scripts/test-firebase-notifications.sh
```
Test push notifications end-to-end

### Step 6: Deploy API
```bash
# Start API server
cd apps/api
npm run dev  # For development
npm run start  # For production
```

### Step 7: Deploy Mobile App
```bash
# iOS
cd apps/mobile
expo build:ios

# Android
expo build:android
```

## 📊 Post-Deployment Verification

### 1. API Health Check
```bash
curl https://your-api-domain.com/api/health
# Expected: {"status":"ok"}
```

### 2. Firebase Connection Test
```bash
curl -X POST https://your-api-domain.com/api/firebase/notifications/register-token \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"token":"test","platform":"ios"}'
# Expected: {"success":true}
```

### 3. Monitor Firebase Console
- Check Cloud Messaging → Last 30 days
- Check Firestore → Usage tab
- Check Storage → Usage
- Check Authentication → Users

### 4. Check Logs
```bash
# Firebase logs
firebase functions:log

# API logs
# Check your logging service (CloudWatch, Datadog, etc.)
```

## 🔒 Security Verification

### 1. Firestore Rules
- [ ] Authenticated users only can read/write
- [ ] Role-based access working
- [ ] Test unauthorized access fails

### 2. Storage Rules
- [ ] File size limits enforced
- [ ] Content type restrictions working
- [ ] User-specific folders protected

### 3. API Security
- [ ] JWT authentication required
- [ ] Scope-based authorization working
- [ ] Rate limiting active
- [ ] Audit logging enabled

## 💰 Cost Monitoring

### Daily Checks (First Week)
- [ ] Check Firebase Console → Usage and Billing
- [ ] Verify within free tier or budget
- [ ] Review Firestore operation counts
- [ ] Monitor Storage usage

### Weekly Checks
- [ ] Review cost trends
- [ ] Optimize high-usage operations
- [ ] Check for unexpected spikes
- [ ] Verify alerts are working

## 🐛 Troubleshooting

### Push Notifications Not Received
1. Check Firebase Console → Cloud Messaging → Logs
2. Verify device token is registered
3. Check APNs certificate (iOS) or FCM config (Android)
4. Test with Firebase Console → Cloud Messaging → Send test message
5. Check app permissions

### Firestore Permission Denied
1. Check `firestore.rules` deployed correctly
2. Verify user is authenticated
3. Test rules in Firebase Console → Firestore → Rules Playground
4. Check user has required role

### High Costs
1. Review Firestore operations (optimize queries)
2. Implement caching (Redis)
3. Batch write operations
4. Remove unused indexes
5. Upgrade plan if needed

## 📞 Support Contacts

### Internal
- DevOps Team: devops@infamousfreight.com
- On-Call: oncall@infamousfreight.com

### External
- Firebase Support: https://firebase.google.com/support
- Firebase Status: https://status.firebase.google.com
- Community: https://stackoverflow.com/questions/tagged/firebase

## 📝 Rollback Plan

### If Issues Occur

1. **Rollback API:**
   ```bash
   # Deploy previous version
   git checkout <previous-commit>
   # Redeploy
   ```

2. **Rollback Firebase Rules:**
   ```bash
   firebase deploy --only firestore:rules --project <project-id>
   ```

3. **Disable FCM (Emergency):**
   - Firebase Console → Cloud Messaging
   - Temporarily disable sending

4. **Switch to Backup:**
   - Update DNS/load balancer
   - Point to previous stable version

## ✅ Sign-Off

### Deployment Team
- [ ] Lead Developer: ______________________ Date: ________
- [ ] DevOps Engineer: _____________________ Date: ________
- [ ] QA Lead: ____________________________ Date: ________

### Stakeholders
- [ ] Product Manager: _____________________ Date: ________
- [ ] Security Officer: ____________________ Date: ________

## 📅 Post-Deployment Schedule

### Day 1
- [ ] Monitor continuously
- [ ] Check all dashboards hourly
- [ ] Be ready for immediate rollback

### Week 1
- [ ] Daily cost reviews
- [ ] Daily performance checks
- [ ] User feedback collection

### Month 1
- [ ] Weekly reviews
- [ ] Optimize based on usage patterns
- [ ] Update documentation based on learnings

---

**Checklist Version:** 1.0.0  
**Last Updated:** February 17, 2026  
**Next Review:** March 17, 2026
