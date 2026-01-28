# Login Page - Implementation Guide

## Overview

Modern, beautiful login page with theme-based styling that calls your `/auth/signin` API endpoint.

---

## Features

✅ **Modern Design** - Beautiful gradient background with floating animations
✅ **Theme Variables** - All colors/styles configurable via CSS variables
✅ **Responsive** - Works on mobile, tablet, and desktop
✅ **Form Validation** - Built-in validation with error messages
✅ **Error Handling** - Displays 422 business exceptions from API
✅ **Password Toggle** - Show/hide password functionality
✅ **Loading States** - Spinner during login process
✅ **Route Guards** - Redirects to home if already logged in

---

## Files Created

```
src/
├── app/
│   ├── features/
│   │   └── auth/
│   │       └── pages/
│   │           └── login/
│   │               ├── login.page.ts           # Component logic
│   │               ├── login.page.html         # Template
│   │               └── login.page.scss         # Styles
│   └── app.routes.ts                          # Updated with login route
│
└── theme/
    └── auth-theme.scss                         # Theme variables
```

---

## API Integration

### Endpoint
```
POST /auth/signin
```

### Request Body
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

### Success Response (200)
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer"
}
```

### Error Response (422 - Business Exception)
```json
{
  "msg": "Invalid username or password"
}
```

The error message from `msg` field will be displayed to the user automatically.

---

## How It Works

### 1. User Enters Credentials
- Username (min 3 characters)
- Password (min 6 characters)
- Form validation shows errors if fields are invalid

### 2. Form Submission
```typescript
onLogin() {
  // Validates form
  if (this.loginForm.invalid) {
    return;
  }

  // Calls AuthUseCase.login()
  this.authUseCase.login(username, password).subscribe({
    next: (user) => {
      // Success: Navigate to /home
      this.router.navigate(['/home']);
    },
    error: (error) => {
      // Error: Display message (422 msg shown to user)
      this.errorMessage = error.message;
    }
  });
}
```

### 3. JWT Token Handling
- Token saved to Capacitor Preferences (secure storage)
- JwtInterceptor automatically adds token to future API calls
- Token persists across app restarts

### 4. Route Protection
- Login page uses `guestGuard` - redirects to /home if already logged in
- Home page uses `authGuard` - redirects to /login if not authenticated

---

## Customizing the Theme

All styles use CSS variables defined in [auth-theme.scss](src/theme/auth-theme.scss).

### Change Colors

**Primary/Secondary Colors:**
```scss
--auth-primary-color: #667eea;        // Main brand color
--auth-secondary-color: #764ba2;      // Secondary brand color
```

**Background Gradient:**
```scss
--auth-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Card Background:**
```scss
--auth-card-background: #ffffff;      // Login card color
```

**Button Gradient:**
```scss
--auth-button-primary-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Example: Blue Theme
```scss
:root {
  --auth-primary-color: #3b82f6;
  --auth-secondary-color: #1e40af;
  --auth-background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  --auth-button-primary-background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
}
```

### Example: Green Theme
```scss
:root {
  --auth-primary-color: #10b981;
  --auth-secondary-color: #059669;
  --auth-background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --auth-button-primary-background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
```

### Example: Dark Theme
```scss
:root {
  --auth-primary-color: #8b5cf6;
  --auth-secondary-color: #6d28d9;
  --auth-background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  --auth-card-background: #1f2937;
  --auth-input-background: #374151;
  --auth-text-primary: #f9fafb;
}
```

---

## Testing the Login Page

### 1. Start the App
```bash
cd jbh-app
npm start
```

### 2. Navigate to Login
Open browser to `http://localhost:8100` (will redirect to `/login`)

### 3. Test Scenarios

**Valid Login:**
- Enter valid username/password
- Click "Sign In"
- Should see loading spinner
- Should navigate to `/home` on success

**Invalid Credentials (422):**
- Enter invalid username/password
- Should show error message from API `msg` field
- Example: "Invalid username or password"

**Validation Errors:**
- Leave username empty → "Username is required"
- Username < 3 chars → "Username must be at least 3 characters"
- Leave password empty → "Password is required"
- Password < 6 chars → "Password must be at least 6 characters"

**Already Logged In:**
- If already authenticated
- Visiting `/login` redirects to `/home` automatically

---

## UI Components

### Password Toggle
Click the eye icon to show/hide password:
```html
<ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
```

### Error Alert
Automatically shown when `errorMessage` is set:
```html
<ion-card class="error-alert" *ngIf="errorMessage">
  <ion-icon name="alert-circle"></ion-icon>
  <span>{{ errorMessage }}</span>
</ion-card>
```

### Loading State
Button shows spinner during login:
```html
<button [disabled]="isLoading" [class.loading]="isLoading">
  <ion-spinner *ngIf="isLoading"></ion-spinner>
  <span *ngIf="!isLoading">Sign In</span>
</button>
```

---

## Responsive Design

### Mobile (< 768px)
- Full screen layout
- Compact padding
- Stacked elements

### Tablet (768px - 1024px)
- Centered card
- Increased padding
- Optimal touch targets

### Desktop (> 1024px)
- Maximum card width: 480px
- Centered with generous spacing
- Enhanced shadows and effects

---

## Accessibility

- ✅ Semantic HTML elements
- ✅ Proper label associations
- ✅ Keyboard navigation support
- ✅ ARIA attributes on form fields
- ✅ Focus states with clear visual indicators
- ✅ Error messages linked to form fields
- ✅ High contrast colors for readability

---

## Security Features

1. **Secure Token Storage** - Uses Capacitor Preferences (encrypted)
2. **Password Hiding** - Password field type="password" by default
3. **HTTPS Required** - Production API must use HTTPS
4. **JWT Expiration** - Tokens expire (handled by backend)
5. **No Token in URL** - Token never exposed in URLs
6. **Auto-logout on 401** - Error interceptor handles expired tokens

---

## Optional Features (Commented Out)

The login page includes commented sections for:

### Remember Me Checkbox
```html
<label class="remember-me">
  <input type="checkbox" />
  <span>Remember me</span>
</label>
```

### Forgot Password Link
```html
<a href="#" class="forgot-password">
  Forgot password?
</a>
```

### Social Login (Google)
```html
<button class="social-button google">
  <ion-icon name="logo-google"></ion-icon>
  <span>Continue with Google</span>
</button>
```

### Sign Up Link
```html
<a href="#">Sign up</a>
```

To enable these features:
1. Implement the corresponding API endpoints
2. Add click handlers in `login.page.ts`
3. Update routes if needed

---

## Troubleshooting

### Login Button Not Working
- Check form validation - all fields must be valid
- Check browser console for errors
- Verify API endpoint is correct in environment config

### 422 Error Not Showing Message
- Verify API response has `msg` or `message` field
- Check error interceptor is handling 422
- Check browser Network tab for API response

### Styles Not Applied
- Verify `auth-theme.scss` is imported in `global.scss`
- Clear browser cache
- Restart dev server

### Token Not Saved
- Check Capacitor Preferences is installed: `npm list @capacitor/preferences`
- Check browser console for storage errors
- Verify TokenStorageService is working

---

## Next Steps

1. **Customize Theme** - Edit `auth-theme.scss` with your brand colors
2. **Add Forgot Password** - Implement password reset flow
3. **Add Registration** - Create sign-up page
4. **Add Social Login** - Integrate OAuth providers
5. **Add Biometric Auth** - Use Capacitor biometric plugin for mobile

---

## File References

- **Component**: [login.page.ts](src/app/features/auth/pages/login/login.page.ts)
- **Template**: [login.page.html](src/app/features/auth/pages/login/login.page.html)
- **Styles**: [login.page.scss](src/app/features/auth/pages/login/login.page.scss)
- **Theme**: [auth-theme.scss](src/theme/auth-theme.scss)
- **Routes**: [app.routes.ts](src/app/app.routes.ts)
- **Auth Use Case**: [auth.use-case.ts](src/app/core/domain/use-cases/auth.use-case.ts)
- **Auth Repository**: [auth.repository.impl.ts](src/app/core/infrastructure/repositories/auth.repository.impl.ts)

---

## Demo Credentials

For testing with your backend, make sure you have test credentials available. The login page will display the exact error message returned from your API's `msg` field for 422 errors.
