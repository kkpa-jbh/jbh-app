# Firebase Cloud Messaging (FCM) Push Notifications Setup

This guide covers the complete setup of push notifications using Firebase Cloud Messaging for both iOS and Android.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Install Capacitor Plugin](#install-capacitor-plugin)
3. [Firebase Project Setup](#firebase-project-setup)
4. [Android Configuration](#android-configuration)
5. [iOS Configuration](#ios-configuration)
6. [Testing Push Notifications](#testing-push-notifications)
7. [Java Microservice Integration](#java-microservice-integration)

---

## Prerequisites

- Firebase account (free): https://console.firebase.google.com
- Xcode (for iOS) with Apple Developer account
- Android Studio (for Android)
- Java microservice ready to send notifications

---

## Install Capacitor Plugin

### 1. Install @capacitor/push-notifications

```bash
npm install @capacitor/push-notifications
npx cap sync
```

### 2. Verify Installation

Check that the plugin is listed in `package.json`:
```json
{
  "dependencies": {
    "@capacitor/push-notifications": "^6.0.0"
  }
}
```

---

## Firebase Project Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Enter project name: `jbh-app` (or your preferred name)
4. Disable Google Analytics (optional for testing)
5. Click **"Create project"**

### 2. Add Android App to Firebase

1. In Firebase Console, click **"Add app"** → Select **Android**
2. **Android package name**: `com.jbhapp.app` (check in `android/app/build.gradle`)
   - Look for `applicationId "com.jbhapp.app"`
3. **App nickname** (optional): "JBH App Android"
4. Click **"Register app"**
5. **Download `google-services.json`** ← IMPORTANT!
6. Click **"Next"** → **"Continue to console"**

### 3. Add iOS App to Firebase

1. In Firebase Console, click **"Add app"** → Select **iOS**
2. **iOS bundle ID**: `com.jbhapp.app` (check in `ios/App/App.xcodeproj`)
   - Open Xcode → Select target → Check **Bundle Identifier**
3. **App nickname** (optional): "JBH App iOS"
4. Click **"Register app"**
5. **Download `GoogleService-Info.plist`** ← IMPORTANT!
6. Click **"Next"** → **"Continue to console"**

---

## Android Configuration

### 1. Add `google-services.json`

Copy the downloaded `google-services.json` to:
```
android/app/google-services.json
```

### 2. Update Android Build Files

#### `android/build.gradle` (project-level)

Add Google services classpath:
```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.2'
        classpath 'com.google.gms:google-services:4.4.0'  // ADD THIS LINE
    }
}
```

#### `android/app/build.gradle` (app-level)

Add at the **bottom** of the file:
```gradle
apply plugin: 'com.google.gms.google-services'  // ADD THIS LINE
```

### 3. Update `AndroidManifest.xml`

File: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest ...>
    <application ...>
        <!-- Add this meta-data for default notification icon -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />

        <!-- Add this meta-data for default notification color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/colorPrimary" />

        <!-- Your existing activities -->
    </application>
</manifest>
```

### 4. Sync and Build

```bash
npx cap sync android
npx cap open android
```

In Android Studio:
1. Click **"Sync Project with Gradle Files"**
2. Build the app to verify no errors

---

## iOS Configuration

### 1. Add `GoogleService-Info.plist`

1. Open Xcode:
   ```bash
   npx cap open ios
   ```

2. In Xcode:
   - Right-click on **"App"** folder
   - Select **"Add Files to 'App'..."**
   - Select your downloaded `GoogleService-Info.plist`
   - **Check**: "Copy items if needed"
   - **Check**: Add to targets: **App**
   - Click **"Add"**

### 2. Enable Push Notifications Capability

1. In Xcode, select your project in the navigator
2. Select the **"App"** target
3. Go to **"Signing & Capabilities"** tab
4. Click **"+ Capability"**
5. Add **"Push Notifications"**
6. Add **"Background Modes"** and check:
   - **Remote notifications**

### 3. Configure Apple Push Notification Service (APNs)

#### Option A: Using APNs Auth Key (Recommended - Easier)

1. Go to https://developer.apple.com/account
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Keys** → **"+"** (Create a new key)
4. Enter name: "JBH App Push Notifications"
5. Check **"Apple Push Notifications service (APNs)"**
6. Click **"Continue"** → **"Register"**
7. **Download the `.p8` file** (you can only download once!)
8. Note the **Key ID** (e.g., `ABC123XYZ`)

9. Upload to Firebase:
   - Go to Firebase Console → **Project Settings**
   - Select **"Cloud Messaging"** tab
   - Under **"Apple app configuration"** → **"APNs Authentication Key"**
   - Click **"Upload"**
   - Upload your `.p8` file
   - Enter **Key ID** and **Team ID** (from Apple Developer account)

#### Option B: Using APNs Certificate (Legacy)

1. In Xcode, select your target
2. Go to **"Signing & Capabilities"**
3. Note your **Bundle Identifier**

4. Go to https://developer.apple.com/account
5. Create an APNs certificate (more complex, not recommended)

### 4. Update `AppDelegate.swift`

File: `ios/App/App/AppDelegate.swift`

Add Firebase import at the top:
```swift
import UIKit
import Capacitor
import FirebaseCore  // ADD THIS

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configure Firebase
        FirebaseApp.configure()  // ADD THIS

        return true
    }

    // ... rest of the code
}
```

### 5. Install Firebase SDK via CocoaPods

File: `ios/App/Podfile`

Add Firebase messaging:
```ruby
platform :ios, '13.0'
use_frameworks!

target 'App' do
  capacitor_pods

  # Add Firebase
  pod 'Firebase/Messaging'
end
```

Then install:
```bash
cd ios/App
pod install
cd ../..
```

### 6. Sync and Build

```bash
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select a real device (push notifications don't work in simulator!)
2. Build and run the app
3. Allow notifications when prompted

---

## Testing Push Notifications

### Test from Firebase Console (Quick Test)

1. Go to Firebase Console → **Messaging**
2. Click **"Create your first campaign"** → **"Firebase Notification messages"**
3. Enter:
   - **Notification title**: "Test Notification"
   - **Notification text**: "This is a test from Firebase"
4. Click **"Send test message"**
5. Enter your **FCM token** (check app console logs)
6. Click **"Test"**

### Get FCM Token from App

The app will log the FCM token on startup:
```
Push Notifications: FCM Token received: dXjK8fF...
FCM Token ready to send to backend: dXjK8fF...
```

Copy this token to test sending notifications.

### Test Scenarios

1. **App in Foreground**: Notification appears in app (console log)
2. **App in Background**: Notification appears in system notification tray
3. **App Killed**: Notification appears in system notification tray
4. **Tap Notification**: App opens and triggers action handler

---

## Java Microservice Integration

### Overview

Your Java microservice needs to:
1. **Store FCM tokens** when the app sends them
2. **Send push notifications** using Firebase Admin SDK

### 1. Install Firebase Admin SDK (Java)

Add to your `pom.xml` (Maven):
```xml
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.2.0</version>
</dependency>
```

Or `build.gradle` (Gradle):
```gradle
implementation 'com.google.firebase:firebase-admin:9.2.0'
```

### 2. Generate Firebase Service Account Key

1. Go to Firebase Console → **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Download the JSON file (e.g., `jbh-app-firebase-adminsdk.json`)
4. **Keep this file secure!** (don't commit to Git)

### 3. Initialize Firebase Admin SDK (Java)

```java
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import java.io.FileInputStream;
import java.io.IOException;

public class FirebaseInitializer {

    public static void initialize() throws IOException {
        FileInputStream serviceAccount =
            new FileInputStream("path/to/jbh-app-firebase-adminsdk.json");

        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();

        FirebaseApp.initializeApp(options);
    }
}
```

### 4. Receive and Store FCM Tokens

Create an endpoint to receive tokens from the app:

```java
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    @PostMapping("/register")
    public ResponseEntity<String> registerDevice(@RequestBody DeviceTokenRequest request) {
        // request.token = FCM token from app
        // request.platform = "ios" or "android"
        // request.userId = current user ID

        // Store in database:
        // - userId
        // - fcmToken
        // - platform
        // - lastUpdated (timestamp)

        deviceService.saveToken(request.getUserId(), request.getToken(), request.getPlatform());

        return ResponseEntity.ok("Token registered successfully");
    }
}
```

App will call this automatically in `PushNotificationService.sendTokenToBackend()`.

### 5. Send Push Notifications from Java

```java
import com.google.firebase.messaging.*;

public class PushNotificationService {

    public void sendNotification(String fcmToken, String title, String body, Map<String, String> data) {
        try {
            Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build())
                .putAllData(data)  // Custom data payload
                .build();

            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Successfully sent message: " + response);

        } catch (FirebaseMessagingException e) {
            e.printStackTrace();
        }
    }

    // Example usage:
    public void notifyUser(String userId, String orderId) {
        String fcmToken = deviceService.getTokenByUserId(userId);

        Map<String, String> data = new HashMap<>();
        data.put("type", "order");
        data.put("orderId", orderId);

        sendNotification(
            fcmToken,
            "Order Update",
            "Your order #" + orderId + " has been shipped!",
            data
        );
    }
}
```

### 6. Send to Multiple Devices (Multicast)

```java
public void sendToMultipleDevices(List<String> tokens, String title, String body) {
    MulticastMessage message = MulticastMessage.builder()
        .setNotification(Notification.builder()
            .setTitle(title)
            .setBody(body)
            .build())
        .addAllTokens(tokens)
        .build();

    try {
        BatchResponse response = FirebaseMessaging.getInstance().sendMulticast(message);
        System.out.println(response.getSuccessCount() + " messages sent successfully");
    } catch (FirebaseMessagingException e) {
        e.printStackTrace();
    }
}
```

### 7. Update App to Send Token to Backend

Update `PushNotificationService.sendTokenToBackend()`:

```typescript
// src/app/core/infrastructure/push/push-notification.service.ts

async sendTokenToBackend(token: string): Promise<void> {
  try {
    const platform = this.platform.is('ios') ? 'ios' : 'android';

    // Replace with your actual API endpoint
    await fetch('https://your-backend.com/api/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + yourAuthToken  // Add auth if needed
      },
      body: JSON.stringify({
        token: token,
        platform: platform
      })
    });

    console.log('Token sent to backend successfully');
  } catch (error) {
    console.error('Error sending token to backend:', error);
  }
}
```

---

## Troubleshooting

### Android Issues

**Error: "google-services.json missing"**
- Ensure `google-services.json` is in `android/app/`
- Run `npx cap sync android`

**Error: "Firebase not initialized"**
- Check `google-services` plugin is applied in `android/app/build.gradle`
- Rebuild project in Android Studio

### iOS Issues

**Error: "No APNs certificate or auth key"**
- Upload APNs auth key in Firebase Console
- Verify Team ID and Key ID are correct

**Push notifications not received on device**
- Push notifications **don't work on iOS Simulator** - use real device!
- Check notifications are enabled: Settings → Your App → Notifications

**Error: "Firebase/Core module not found"**
- Run `cd ios/App && pod install`
- Open Xcode and clean build folder

### General Issues

**Token not received**
- Check console logs for errors
- Verify Firebase project is correctly configured
- Ensure app has notification permissions

**Notifications not appearing**
- Test in different states (foreground, background, killed)
- Check notification permissions in device settings
- Verify FCM token is valid and sent to backend

---

## Next Steps

1. ✅ Install Capacitor plugin: `npm install @capacitor/push-notifications`
2. ✅ Create Firebase project
3. ✅ Configure Android (google-services.json)
4. ✅ Configure iOS (GoogleService-Info.plist, APNs)
5. ✅ Update Java microservice to send notifications
6. ✅ Test on real devices!

---

## Additional Resources

- [Capacitor Push Notifications Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK (Java)](https://firebase.google.com/docs/admin/setup)
- [APNs Configuration](https://firebase.google.com/docs/cloud-messaging/ios/certs)

---

**Created:** 2025-12-13
**Last Updated:** 2025-12-13
**Status:** Ready for implementation
