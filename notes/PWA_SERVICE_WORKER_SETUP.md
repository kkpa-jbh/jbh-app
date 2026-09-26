# PWA Service Worker Auto-Update Setup

This guide explains how to enable automatic updates for the PWA (web) version of the app using service workers.

## Overview

The service worker implementation provides:
- ✅ **Automatic update checking** every 60 seconds
- ✅ **Update on app focus** when user returns to app
- ✅ **User notification** when update is available
- ✅ **One-click update** with automatic page reload
- ✅ **Offline caching** of app assets

**Note:** This only works for PWA (web browser). Native apps (iOS/Android) cannot use service workers for auto-updates.

---

## Setup Instructions

### 1. Update `angular.json` to Include Service Worker

Add the service worker file to the assets array:

File: `angular.json`

```json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              {
                "glob": "**/*",
                "input": "src/assets",
                "output": "assets"
              },
              {
                "glob": "**/*.svg",
                "input": "node_modules/ionicons/dist/ionicons/svg",
                "output": "./svg"
              },
              {
                "glob": "sw.js",
                "input": "src",
                "output": "/"
              }
            ]
          }
        }
      }
    }
  }
}
```

### 2. Update `index.html` (Optional - for manual registration)

The service worker is already registered automatically via `SwUpdateService`, but you can also add a manual fallback in `index.html`:

File: `src/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- existing head content -->
</head>
<body>
  <app-root></app-root>

  <!-- Service Worker Registration (optional fallback) -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('ServiceWorker registered:', registration.scope);
          })
          .catch(error => {
            console.error('ServiceWorker registration failed:', error);
          });
      });
    }
  </script>
</body>
</html>
```

### 3. Build and Deploy

Build the app for production:

```bash
ionic build --prod
```

The service worker will be automatically included in the build output (`www/sw.js`).

---

## How It Works

### Automatic Update Flow

1. **App Loads**: Service worker registers and caches initial assets
2. **Update Check**: Every 60 seconds, the app checks for new version
3. **Update Found**: If new version detected, service worker starts installing
4. **User Notification**: Toast appears: "A new version is available!"
5. **User Action**: User clicks "Update Now" or dismisses
6. **Update Applied**: Page reloads with new version

### Update Triggers

Updates are checked:
- ✅ Every 60 seconds (configurable in `SwUpdateService`)
- ✅ When app tab becomes visible (user switches back to tab)
- ✅ On page load/reload
- ✅ Manually via `SwUpdateService.checkForUpdate()`

---

## Customization

### Change Update Check Interval

File: `src/app/core/infrastructure/pwa/sw-update.service.ts`

```typescript
private checkInterval = 60000; // Change to desired milliseconds
// Example: 30000 = 30 seconds, 300000 = 5 minutes
```

### Automatic Updates (No User Prompt)

If you want to apply updates automatically without asking the user:

File: `src/app/app.component.ts`

```typescript
this.swUpdateService.updateAvailable$.subscribe(async (status) => {
  if (status.available) {
    // Automatically apply update without user prompt
    this.swUpdateService.applyUpdate();
  }
});
```

### Custom Update Notification

Replace the toast with a custom modal or banner:

File: `src/app/app.component.ts`

```typescript
this.swUpdateService.updateAvailable$.subscribe(async (status) => {
  if (status.available) {
    // Show custom modal
    const modal = await this.modalController.create({
      component: UpdateAvailableModalComponent,
      backdropDismiss: false
    });
    await modal.present();
  }
});
```

---

## Testing Service Worker Updates

### 1. Build and Serve Locally

```bash
# Build production version
ionic build --prod

# Serve the build (service workers only work in production mode)
npx http-server www -p 8081 -P http://localhost:8080   # not 8080: jbh-gateway uses it. -P sends /jbh-api calls to the gateway (the prod build uses a relative /jbh-api)
```

Open: http://localhost:8081

### 2. Simulate an Update

1. Make a change to any file (e.g., change a color in `src/theme/variables.scss`)
2. Rebuild: `ionic build --prod`
3. The running app will detect the update within 60 seconds
4. You should see the toast: "A new version is available!"

### 3. Test Update Flow

1. Click "Update Now"
2. Page should reload
3. Your changes should be visible

### 4. Check Service Worker Status

Open Chrome DevTools:
1. Go to **Application** tab
2. Click **Service Workers**
3. You should see your service worker registered
4. Status should show "activated and is running"

---

## Deployment Considerations

### For Production Deployment

When deploying to production (e.g., Firebase Hosting, Netlify, Vercel):

1. **Build for production**:
   ```bash
   ionic build --prod
   ```

2. **Deploy the `www` folder** to your hosting provider

3. **Ensure HTTPS**: Service workers require HTTPS (except localhost)

4. **Cache Strategy**: The service worker caches all assets on first load
   - Users can use the app offline after first visit
   - Updates are fetched in the background

### Cache Versioning

When you deploy a new version:

1. Update the cache name in `src/sw.js`:
   ```javascript
   const CACHE_NAME = 'jbh-app-v2'; // Increment version number
   ```

2. Old caches are automatically deleted on service worker activation

### Recommended: Versioning Strategy

Update the cache version with your app version:

```javascript
// src/sw.js
const APP_VERSION = '1.2.0'; // Match package.json version
const CACHE_NAME = `jbh-app-${APP_VERSION}`;
```

---

## Troubleshooting

### Service Worker Not Registering

**Problem**: Service worker doesn't register

**Solutions**:
- Ensure you're using HTTPS (or localhost)
- Check browser console for errors
- Verify `sw.js` is in the root of `www/` folder
- Check `angular.json` assets configuration

### Updates Not Detected

**Problem**: Changes not showing up

**Solutions**:
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache and storage
- Unregister service worker: DevTools → Application → Service Workers → Unregister
- Verify cache name was updated in `sw.js`

### Service Worker Stuck on Old Version

**Problem**: Old service worker still active

**Solutions**:
1. Chrome DevTools → Application → Service Workers
2. Click "Unregister" next to your service worker
3. Hard refresh the page
4. Service worker will re-register with new version

### Testing in Development

**Problem**: Service worker not working in `ionic serve`

**Reason**: Service workers are disabled in dev mode by default

**Solution**: Build and serve production version:
```bash
ionic build --prod
npx http-server www -p 8081 -P http://localhost:8080   # not 8080: jbh-gateway uses it. -P sends /jbh-api calls to the gateway (the prod build uses a relative /jbh-api)
```

---

## Advanced: Push Notifications via Service Worker

For web push notifications (separate from native FCM):

1. Use Firebase Cloud Messaging for Web
2. Update `sw.js` to include FCM messaging handler
3. Register for web push in your app

This is separate from native push notifications and requires additional setup.

---

## Monitoring Service Worker

### View Service Worker Status

```typescript
// In any component
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active service workers:', registrations);
});
```

### Listen for Service Worker Messages

```typescript
// src/app/core/infrastructure/pwa/sw-update.service.ts
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('Message from service worker:', event.data);
});
```

---

## Benefits of Service Worker Auto-Updates

✅ **Zero Downtime**: Users get updates without manual app store downloads
✅ **Instant Updates**: Deploy fixes and features immediately
✅ **Better UX**: Users always have the latest version
✅ **Offline Support**: App works offline after first load
✅ **Faster Loads**: Cached assets load instantly

---

## Important Notes

- ⚠️ Service workers **only work for PWA (web)**
- ⚠️ Native apps (iOS/Android) cannot use service workers
- ⚠️ For native auto-updates, use **Capacitor Live Updates** (paid service)
- ⚠️ Service workers require **HTTPS** (except localhost)
- ⚠️ Be cautious with aggressive caching - always test update flow

---

**Created:** 2025-12-13
**Last Updated:** 2025-12-13
**Status:** Ready for implementation
