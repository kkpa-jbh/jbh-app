# Refresh Token Implementation

## Overview

The refresh token flow automatically renews expired access tokens without requiring users to re-login. The implementation uses different strategies for web (PWA/Browser) vs mobile (iOS/Android) platforms.

## Token Expiration Detection

When an access token expires, the Gateway returns:

```json
HTTP 401 Unauthorized
{
  "error_code": "AUTH_TOKEN_EXPIRED",
  "message": "Access token has expired",
  "timestamp": 1734357890123
}
```

The `ErrorInterceptor` checks **both**:
1. HTTP status code === `401`
2. Response body `error_code` === `"AUTH_TOKEN_EXPIRED"`

## Platform-Specific Behavior

### Web (PWA / Browser)

**Token Storage:**
- ✅ Access Token: Stored in Capacitor Preferences (fallback to localStorage)
- ✅ Refresh Token: HTTP-only cookie (set by backend, secure, not accessible via JS)

**Refresh Flow:**
1. Access token expires → 401 error with `AUTH_TOKEN_EXPIRED`
2. Error interceptor detects platform is web
3. Calls `/auth/refresh` endpoint with **NO** refresh token in body
4. Request automatically includes HTTP-only cookie via `withCredentials: true`
5. Backend reads refresh token from cookie
6. Backend returns new access token (and updates refresh token cookie)
7. New access token saved to Capacitor Preferences
8. Original request retried with new access token

**Important:**
- ❌ DO NOT store refresh token in localStorage/sessionStorage
- ❌ DO NOT manually extract refresh token from cookies
- ❌ DO NOT send refresh token in Authorization header
- ✅ Cookies are sent automatically via `withCredentials: true`

### Mobile (iOS / Android via Capacitor)

**Token Storage:**
- ✅ Access Token: Secure storage (iOS Keychain / Android Keystore)
- ✅ Refresh Token: Secure storage (iOS Keychain / Android Keystore)

**Refresh Flow:**
1. Access token expires → 401 error with `AUTH_TOKEN_EXPIRED`
2. Error interceptor detects platform is mobile (Capacitor)
3. Gets refresh token from secure storage
4. Calls `/auth/refresh` endpoint with refresh token **in request body**
5. Backend returns new access token and refresh token
6. Both tokens saved to secure storage
7. Original request retried with new access token

**Important:**
- ✅ Both tokens stored securely (Keychain/Keystore)
- ✅ Refresh token sent explicitly in request body
- ✅ All tokens encrypted at rest by OS

## Code Flow

### 1. Error Interceptor (`error.interceptor.ts`)

```typescript
// Intercept all HTTP errors
intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check for 401 + AUTH_TOKEN_EXPIRED
      if (error.status === 401 && !isPublicApi) {
        return this.handle401Error(request, next, error);
      }
      return throwError(() => error);
    })
  );
}
```

### 2. Token Expiration Check

```typescript
private isTokenExpiredError(error: HttpErrorResponse): boolean {
  const errorBody = error.error;

  if (errorBody && typeof errorBody === 'object') {
    return errorBody.error_code === 'AUTH_TOKEN_EXPIRED';
  }

  // Default: assume token expiration (safer to attempt refresh)
  return true;
}
```

### 3. Refresh Token Logic

```typescript
private async refreshAccessToken(): Promise<boolean> {
  const isMobile = this.platform.is('capacitor');

  if (isMobile) {
    // Mobile: Get from secure storage, send in body
    const refreshToken = await this.tokenStorage.getRefreshToken();
    const newToken = await firstValueFrom(
      this.authRepository.refreshToken(refreshToken)
    );
    await this.tokenStorage.saveToken(newToken);
  } else {
    // Web: Don't send refresh token (comes from cookie)
    const newToken = await firstValueFrom(
      this.authRepository.refreshToken() // No parameter!
    );
    await this.tokenStorage.saveToken(newToken);
  }
}
```

### 4. Auth Repository (`auth.repository.impl.ts`)

```typescript
refreshToken(refreshToken?: string): Observable<AuthToken> {
  // Mobile: sends { refreshToken: "..." }
  // Web: sends {} (token comes from cookie)
  const body = refreshToken ? { refreshToken } : {};

  return this.post<any>(
    '/auth/refresh',
    body,
    { context: new HttpContext().set(IS_PUBLIC_API, true) }
  ).pipe(map(response => this.mapToAuthToken(response)));
}
```

## Concurrency Handling

Multiple requests failing simultaneously are handled correctly:

1. **First 401**: Starts refresh process, sets `isRefreshing = true`
2. **Subsequent 401s**: Wait for refresh to complete via `refreshTokenSubject`
3. **On Success**: All waiting requests retry with new token
4. **On Failure**: All requests fail, user logged out

```typescript
// If already refreshing, wait for result
if (this.isRefreshing) {
  return this.refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(() => from(this.addTokenToRequest(request))),
    switchMap(req => next.handle(req))
  );
}
```

## API Contract

### Refresh Token Endpoint

**Endpoint:** `POST /auth/refresh`

**Request (Mobile):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Request (Web):**
```json
{}
```
*(Refresh token comes from HTTP-only cookie)*

**Response (Both):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**Response on Failure:**
```json
HTTP 401 Unauthorized
{
  "error_code": "AUTH_REFRESH_TOKEN_INVALID",
  "message": "Refresh token is invalid or expired"
}
```

## Testing

### Test Token Expiration

1. **Mock expired token response:**
   ```typescript
   // In your test
   const mockError = {
     status: 401,
     error: {
       error_code: 'AUTH_TOKEN_EXPIRED',
       message: 'Access token has expired',
       timestamp: Date.now()
     }
   };
   ```

2. **Verify refresh is called:**
   ```typescript
   expect(authRepository.refreshToken).toHaveBeenCalled();
   ```

3. **Verify original request retried:**
   ```typescript
   expect(httpClient.get).toHaveBeenCalledTimes(2); // Original + retry
   ```

### Test Platform Detection

```typescript
// Mock mobile
spyOn(platform, 'is').and.returnValue(true); // Capacitor
// Verify refresh token sent in body

// Mock web
spyOn(platform, 'is').and.returnValue(false);
// Verify refresh token NOT in body
```

## Security Best Practices

### Web
- ✅ Refresh token in HTTP-only cookie (XSS protection)
- ✅ Secure flag (HTTPS only)
- ✅ SameSite=Strict or Lax (CSRF protection)
- ✅ Access token in memory/Preferences (less sensitive)

### Mobile
- ✅ Both tokens in secure storage (Keychain/Keystore)
- ✅ OS-level encryption
- ✅ No exposure to JS runtime

## Common Issues

### Issue: Refresh token not found on mobile
**Cause:** Token not saved after login
**Fix:** Verify `AuthUseCase.login()` calls `tokenStorage.saveToken()`

### Issue: Infinite refresh loop
**Cause:** `/auth/refresh` endpoint returning 401
**Fix:** Ensure refresh endpoint is marked as `IS_PUBLIC_API`

### Issue: Cookie not sent on web
**Cause:** `withCredentials` not enabled
**Fix:** Verify `JwtInterceptor` sets `withCredentials: true` on all requests

### Issue: CORS error on refresh
**Cause:** Backend doesn't allow credentials
**Fix:** Backend must set:
```
Access-Control-Allow-Credentials: true
Access-Control-Allow-Origin: <specific-origin> (not *)
```

## Files Modified

- `src/app/core/infrastructure/interceptors/error.interceptor.ts` - Main refresh logic
- `src/app/core/infrastructure/interceptors/jwt.interceptor.ts` - Adds `withCredentials: true`
- `src/app/core/infrastructure/repositories/auth.repository.impl.ts` - Refresh endpoint
- `src/app/core/domain/repositories/auth.repository.ts` - Interface update
- `src/app/core/infrastructure/persistence/token-storage.service.ts` - Token storage

## Related Documentation

- [AUTH_QUICK_REFERENCE.md](./AUTH_QUICK_REFERENCE.md) - Authentication system overview
- [AUTH_SETUP.md](./AUTH_SETUP.md) - Complete authentication setup guide
