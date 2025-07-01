# Firebase Native Setup (Optional)

## Why Web Config is Primary

React Native uses the **Firebase JavaScript SDK**, which requires the **Web app configuration**. The native Android/iOS configs are optional and only needed for:

- Push Notifications (FCM)
- Crashlytics
- Performance Monitoring
- Analytics (enhanced)
- Dynamic Links

## Adding Native Configurations (Optional)

### Android Setup

1. **Download google-services.json**:
   - Firebase Console → Project Settings → Your apps
   - Click "Add app" → Android
   - Package name: `com.roofroot`
   - Download `google-services.json`

2. **Place the file**:
   ```
   android/app/google-services.json
   ```

3. **Add to build.gradle**:
   ```gradle
   // android/app/build.gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### iOS Setup

1. **Download GoogleService-Info.plist**:
   - Firebase Console → Project Settings → Your apps
   - Click "Add app" → iOS
   - Bundle ID: `com.roofroot`
   - Download `GoogleService-Info.plist`

2. **Add to Xcode project**:
   - Drag file into Xcode project
   - Add to target

## Current Setup (Recommended)

For most React Native apps, the **Web configuration is sufficient** because:

✅ Authentication works perfectly  
✅ Firestore database works perfectly  
✅ Real-time listeners work perfectly  
✅ Offline persistence works perfectly  
✅ Security rules work perfectly  

## When to Add Native Configs

Only add native configs if you need:
- Push notifications
- Crash reporting
- Performance monitoring
- Enhanced analytics
- Dynamic links

## Summary

- **Web config** = Required for React Native
- **Native configs** = Optional for advanced features
- **Current setup** = Perfect for auth and database 