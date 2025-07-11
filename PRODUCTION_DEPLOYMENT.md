# Production Deployment Guide

This guide covers deploying your RoofRoot app to production for both the backend API and the mobile app.

## Backend Deployment

### Option 1: Google Cloud Run (Recommended)

1. **Install Google Cloud CLI**
   ```bash
   # macOS
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Enable required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Deploy the backend**
   ```bash
   cd backend
   npm run deploy
   ```

4. **Get the deployed URL**
   ```bash
   gcloud run services describe roofroot-backend --region=us-central1 --format="value(status.url)"
   ```

5. **Update your app configuration**
   Replace the placeholder URL in your app with the actual deployed URL:
   - `src/firebase/googleCloudStorage.ts`
   - `src/components/ListingForm.tsx`

### Option 2: Heroku

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. **Create Heroku app**
   ```bash
   cd backend
   heroku create roofroot-backend
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

### Option 3: Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd backend
   vercel --prod
   ```

## Mobile App Deployment

### 1. Build Configuration

Update your app configuration for production:

```typescript
// src/firebase/googleCloudStorage.ts
const getApiBaseUrl = () => {
  if (isProduction) {
    return 'https://your-deployed-backend-url.com'; // Your actual deployed URL
  }
  // Development URLs...
};
```

### 2. Environment Variables

Create environment-specific configurations:

```typescript
// src/config/environment.ts
export const config = {
  development: {
    apiUrl: 'http://192.168.0.249:3000',
    firebaseConfig: { /* dev config */ }
  },
  production: {
    apiUrl: 'https://your-deployed-backend-url.com',
    firebaseConfig: { /* prod config */ }
  }
};
```

### 3. Build for Production

#### Android
```bash
# Generate release keystore
keytool -genkey -v -keystore android/app/release-key.keystore -alias roofroot-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Build release APK
cd android
./gradlew assembleRelease

# Or build AAB for Play Store
./gradlew bundleRelease
```

#### iOS
```bash
# Archive for App Store
npx react-native run-ios --configuration Release
```

### 4. App Store Deployment

#### Google Play Store
1. Create developer account ($25 one-time fee)
2. Upload AAB file
3. Fill store listing details
4. Submit for review

#### Apple App Store
1. Create Apple Developer account ($99/year)
2. Create app in App Store Connect
3. Upload IPA file
4. Submit for review

## Security Considerations

### 1. Environment Variables
```bash
# Don't commit sensitive data
echo "service-account-key.json" >> .gitignore
echo ".env" >> .gitignore
```

### 2. API Security
- Use HTTPS in production
- Implement rate limiting
- Add authentication if needed
- Validate file uploads

### 3. Google Cloud Storage
- Set proper CORS policies
- Use signed URLs for sensitive operations
- Implement proper access controls

## Monitoring and Analytics

### 1. Backend Monitoring
```bash
# Google Cloud Monitoring
gcloud monitoring dashboards create

# Or use external services
# - New Relic
# - DataDog
# - Sentry
```

### 2. Mobile App Analytics
```typescript
// Add analytics to your app
import analytics from '@react-native-firebase/analytics';

// Track events
analytics().logEvent('listing_created', {
  price: listing.price,
  location: listing.location
});
```

## Cost Optimization

### 1. Google Cloud Storage
- Use appropriate storage classes
- Implement lifecycle policies
- Monitor usage

### 2. Backend Hosting
- Google Cloud Run: Pay per request
- Heroku: Monthly dyno costs
- Vercel: Free tier available

### 3. Mobile App
- Optimize image sizes
- Implement caching
- Use CDN for static assets

## Testing Production

### 1. Staging Environment
```typescript
// Create staging configuration
const isStaging = process.env.NODE_ENV === 'staging';
const isProduction = process.env.NODE_ENV === 'production';
```

### 2. Beta Testing
- Use TestFlight (iOS)
- Use Google Play Console (Android)
- Internal testing groups

### 3. Monitoring
```typescript
// Add error tracking
import crashlytics from '@react-native-firebase/crashlytics';

crashlytics().log('App started');
crashlytics().recordError(error);
```

## Checklist Before Production

- [ ] Backend deployed and tested
- [ ] API URLs updated in app
- [ ] Environment variables configured
- [ ] Security measures implemented
- [ ] Error tracking enabled
- [ ] Analytics configured
- [ ] App icons and metadata ready
- [ ] Privacy policy and terms of service
- [ ] Store listing content prepared
- [ ] Beta testing completed
- [ ] Performance optimized
- [ ] Security audit completed

## Troubleshooting Production Issues

### Common Issues:

1. **API not accessible**
   - Check CORS configuration
   - Verify deployed URL
   - Check firewall settings

2. **Image uploads failing**
   - Verify Google Cloud Storage permissions
   - Check service account key
   - Monitor storage quotas

3. **App crashes**
   - Check crashlytics logs
   - Review error tracking
   - Test on multiple devices

4. **Performance issues**
   - Optimize image sizes
   - Implement caching
   - Monitor API response times 