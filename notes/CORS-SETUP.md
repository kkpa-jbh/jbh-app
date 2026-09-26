# CORS Configuration Guide

> **Production (current setup):** the app and the API share one host, `https://jbh.usemagus.cloud`. Caddy (shared with Magus) serves the app at `/` and sends `/jbh-api` to `jbh-gateway`. Same origin means **no CORS is needed**. The CORS steps below apply only if you split the app and the API into two domains, or ship native mobile builds.

## Overview
This document explains the Cross-Origin Resource Sharing (CORS) setup for the JBH application.

## Development Environment

### Proxy Configuration
For **local development**, we use an Angular proxy to avoid CORS issues when the frontend (`http://localhost:8100`) calls the backend (`http://localhost:8080`).

**Configuration Files:**
- `proxy.conf.json` - Proxy configuration
- `angular.json` - References the proxy config
- `src/environments/environment.ts` - Uses relative URL `/jbh-api`

**How it works:**
1. Frontend makes request to `/jbh-api/auth/signin`
2. Angular dev server proxies the request to `http://localhost:8080/jbh-api/auth/signin`
3. No CORS error because browser sees same origin

### Running with Proxy
```bash
# The proxy is automatically enabled when you run:
ionic serve
# or
ng serve
```

## Production/Staging Environment

### Backend CORS Configuration Required
For **production and staging**, the API Gateway MUST have CORS headers configured since the proxy only works in development.

### Required CORS Headers
Your API Gateway/Backend at `http://localhost:8080` (or production URL) must return these headers:

```
Access-Control-Allow-Origin: https://your-app-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

### Allowed Origins
Configure based on environment:
- **Development:** `http://localhost:8100` (if testing without proxy)
- **Staging:** `https://stg-app.yourdomain.com`
- **Production:** `https://app.yourdomain.com`
- **Mobile:** `capacitor://localhost` and `ionic://localhost` (for Capacitor apps)

## API Gateway Configuration Examples

### Spring Cloud Gateway (Java)
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("https://app.yourdomain.com");
        config.addAllowedOrigin("capacitor://localhost");
        config.addAllowedOrigin("ionic://localhost");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsWebFilter(source);
    }
}
```

### Express.js Gateway
```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'https://app.yourdomain.com',
    'capacitor://localhost',
    'ionic://localhost'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));
```

### AWS API Gateway
Add CORS configuration in API Gateway console:
- Access-Control-Allow-Origin: `https://app.yourdomain.com`
- Access-Control-Allow-Methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- Access-Control-Allow-Headers: `Content-Type,Authorization,Accept`

## Mobile App (Capacitor)

### Native HTTP Plugin (Optional)
For production mobile apps, consider using Capacitor's HTTP plugin which bypasses CORS:

```typescript
import { CapacitorHttp } from '@capacitor/core';

const response = await CapacitorHttp.post({
  url: 'https://api.yourdomain.com/jbh-api/auth/signin',
  headers: { 'Content-Type': 'application/json' },
  data: { usernameOrEmail, password }
});
```

## Troubleshooting

### CORS Error in Development
**Problem:** Still getting CORS errors after setting up proxy
**Solution:**
1. Restart the dev server: `ionic serve`
2. Verify `proxy.conf.json` exists and is correct
3. Check `angular.json` has `"proxyConfig": "proxy.conf.json"`
4. Ensure `environment.ts` uses relative URL `/jbh-api`

### CORS Error in Production
**Problem:** App works in development but fails in production
**Solution:**
1. Verify backend has CORS headers configured
2. Check allowed origins match your domain
3. Test with browser dev tools network tab
4. Verify preflight OPTIONS requests return 200

### Preflight Request Fails
**Problem:** OPTIONS request returns 403 or 404
**Solution:**
1. Ensure API Gateway handles OPTIONS method
2. Don't require authentication for OPTIONS requests
3. Return CORS headers on OPTIONS response

## Testing CORS

### Test with cURL
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v http://localhost:8080/jbh-api/auth/signin

# Test actual request
curl -X POST \
  -H "Origin: https://app.yourdomain.com" \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"test@test.com","password":"test"}' \
  -v http://localhost:8080/jbh-api/auth/signin
```

### Expected Response Headers
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.yourdomain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Accept
```

## Security Notes

1. **Never use `*` for Access-Control-Allow-Origin in production** - Always specify exact domains
2. **Only enable credentials if needed** - Set `Access-Control-Allow-Credentials: true` only if using cookies/auth
3. **Whitelist specific headers** - Don't use `*` for allowed headers in production
4. **Use HTTPS in production** - Mixed content (HTTP/HTTPS) can cause CORS issues

## Summary

- **Development:** Use proxy configuration (already set up)
- **Production:** Configure CORS headers on API Gateway
- **Mobile:** CORS not an issue with native HTTP, but still configure for web version





# CORS Configuration Guide


⏺ CORS Issue Fixed!

  I've configured your Ionic app to handle CORS errors. Here's what I did:

  Changes Made:

  1. Created proxy.conf.json - Proxies API requests in development to avoid CORS
  2. Updated angular.json - Added proxy configuration to the serve options
  3. Updated environment.ts - Changed API URL from http://localhost:8080/jbh-api to /jbh-api (relative URL)
  4. Created CORS-SETUP.md - Comprehensive documentation about CORS configuration

  What You Need to Do:

  1. Restart Your Dev Server

  # Stop your current server (Ctrl+C) and restart:
  ionic serve

  The proxy will now forward requests from your app to http://localhost:8080/jbh-api without CORS issues.

  2. Configure Your API Gateway (Required for Production)

  Your backend API Gateway at http://localhost:8080 needs to add CORS headers. Here's what it should return:

  Access-Control-Allow-Origin: https://your-app-domain.com
  Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, Accept
  Access-Control-Allow-Credentials: true

  Important Origins to Allow:
  - Development: http://localhost:8100 (if testing without proxy)
  - Production: Your production domain
  - Mobile: capacitor://localhost and ionic://localhost

  I've created detailed backend configuration examples in CORS-SETUP.md for Spring Cloud Gateway, Express.js, and AWS API
  Gateway.

  How It Works Now:

  Development (with proxy):
  Frontend Request: /jbh-api/auth/signin
      ↓
  Angular Dev Server Proxy
      ↓
  Backend: http://localhost:8080/jbh-api/auth/signin

  Production:
  Frontend: https://app.yourdomain.com
      ↓ (CORS headers required)
  Backend: https://api.yourdomain.com/jbh-api/auth/signin

  The login should work now after restarting the dev server!
