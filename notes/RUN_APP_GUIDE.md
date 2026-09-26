# How to Run the Application

## ✅ Prerequisites Installed

All required dependencies are now installed:
- ✅ Node.js and npm
- ✅ Ionic CLI
- ✅ Angular CLI
- ✅ @capacitor/preferences

---

## 🚀 Start the Development Server

### Option 1: Using npm (Recommended)
```bash
npm start
```

### Option 2: Using Ionic CLI
```bash
ionic serve
```

### Option 3: Using Angular CLI
```bash
ng serve
```

All three commands do the same thing - start the development server.

```
ionic serve --external
```

---

## 📱 Access the Application

Once the server starts, open your browser to:

```
http://localhost:8100
```

The app will automatically redirect you to the **login page** at:
```
http://localhost:8100/login
```

---

## 🧪 Test the Login Page

### 1. Make Sure Your Backend API is Running

The app calls `jbh-gateway` at `http://localhost:8080/jbh-api` (through the dev proxy).
The gateway needs `jbh-iam` and `jbh-personal-finance` running and registered in Consul.
See `jbh-deploy/README.md` (start order) for the full list.

### 2. Test Login Flow

**Valid Login:**
- Enter your username (min 3 chars)
- Enter your password (min 6 chars)
- Click "Sign In"
- Should see loading spinner
- On success → redirects to `/home`
- JWT token saved automatically

**Invalid Credentials (422):**
- Enter wrong username/password
- Click "Sign In"
- Should see error message from API `msg` field
- Example: "Invalid username or password"

**Validation Errors:**
- Leave fields empty → "Field is required"
- Username too short → "Username must be at least 3 characters"
- Password too short → "Password must be at least 6 characters"

---

## 🔍 Troubleshooting

### Issue: "Waiting for connectivity with ng..."

**Solution:**
This was caused by missing dependencies. Now fixed! All TypeScript compilation errors have been resolved.

### Issue: Build errors

**Solution:**
- Clear the build cache: `rm -rf .angular`
- Reinstall dependencies: `npm install`
- Restart the server: `npm start`

### Issue: Port 8100 already in use

**Solution:**
```bash
# Kill the process using port 8100
lsof -ti:8100 | xargs kill -9

# Or use a different port
ionic serve --port 8101
```

### Issue: CORS errors in browser

**Solution:**
Make sure your backend API has CORS enabled for `http://localhost:8100`

### Issue: Cannot connect to API

**Solution:**
1. Verify the gateway is running: `curl http://localhost:8080/actuator/health`
2. Check API URL in `src/environments/environment.ts`
3. Check browser Network tab for the actual API call

---

## 🛠️ Development Commands

### Start Development Server
```bash
npm start
```

### Build for Production
```bash
ionic build --configuration=production
```

### Build for Staging
```bash
ionic build --configuration=staging
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

---

## 📱 Test on Mobile Devices

### Test on iOS Simulator (Mac only)
```bash
ionic cap run ios
```

### Test on Android Emulator
```bash
ionic cap run android
```

### Test on Physical Device
```bash
# Build the app
ionic build

# Sync with Capacitor
ionic cap sync

# Open in Xcode (iOS)
ionic cap open ios

# Open in Android Studio (Android)
ionic cap open android
```

---

## 🌐 Different Environments

### Local Development (default)
```bash
npm start
# Uses: /jbh-api, proxied to http://localhost:8080 (jbh-gateway)
```

### Staging
```bash
ionic serve --configuration=staging
# Uses: https://stg-api.yourdomain.com/jbh-api
```

### Production Build
```bash
ionic build --configuration=production
# Uses: https://api.yourdomain.com/jbh-api
```

---

## 🎨 Customize Theme While Running

1. Start the dev server: `npm start`
2. Open `src/theme/auth-theme.scss`
3. Change colors (example):
   ```scss
   --auth-primary-color: #3b82f6;  // Blue
   --auth-secondary-color: #1e40af;
   ```
4. Save the file
5. Browser automatically reloads with new theme!

---

## 📊 Check Build Status

### View Detailed Build Output
```bash
ionic build --verbose
```

### Check Bundle Sizes
```bash
ionic build --configuration=production --stats-json
```

---

## 🔥 Hot Reload

The dev server has **hot reload** enabled by default:
- Edit any TypeScript file → Browser refreshes automatically
- Edit any HTML template → Browser refreshes automatically
- Edit any SCSS file → Styles update without refresh

---

## 🐛 Debug Mode

### Open Browser DevTools
1. Press `F12` or `Right-click → Inspect`
2. Go to **Console** tab for logs
3. Go to **Network** tab to see API calls
4. Go to **Application** tab to see stored tokens

### View Environment Info
Open console in browser, you should see:
```
=== Environment Configuration ===
Environment: local
Production: false
API Base URL: /jbh-api
Debug Mode: true
================================
```

---

## ✅ Verification Checklist

- [ ] Dev server starts without errors
- [ ] Browser opens to login page
- [ ] Login form displays correctly
- [ ] Form validation works (try empty fields)
- [ ] Password toggle works (click eye icon)
- [ ] Can submit login form
- [ ] API calls go to correct endpoint
- [ ] 422 errors show API message
- [ ] Successful login redirects to /home
- [ ] JWT token stored in browser
- [ ] Theme looks good on mobile/tablet/desktop

---

## 📖 Next Steps

Once the app is running:

1. **Test Login** with your backend credentials
2. **Customize Theme** in `auth-theme.scss`
3. **Add More Pages** in `src/app/features/`
4. **Create Repositories** extending `ApiBaseService`
5. **Protect Routes** with `authGuard`

---

## 🆘 Still Having Issues?

### Get More Info
```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check Ionic version
ionic --version

# Check installed packages
npm list --depth=0
```

### Clean Start
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
rm -rf .angular

# Start fresh
npm start
```

---

## 🎉 Success!

If you see the login page with the gradient background and animated circles, **you're all set!**

The app is now running and ready for testing. Try logging in with your credentials!
