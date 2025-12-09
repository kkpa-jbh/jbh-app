# Environment Configuration Guide

This project supports three environments: **Local**, **Staging (STG)**, and **Production (PROD)**.

## Environment Files

| Environment | File | API URL |
|-------------|------|---------|
| Local (Development) | `src/environments/environment.ts` | `http://localhost:8080/jbh-api` |
| Staging | `src/environments/environment.stg.ts` | `https://stg-api.yourdomain.com/jbh-api` |
| Production | `src/environments/environment.prod.ts` | `https://api.yourdomain.com/jbh-api` |

## Environment Configuration Structure

Each environment file contains:

```typescript
export const environment = {
  production: boolean,           // true for prod/stg, false for local
  environmentName: string,        // 'local', 'staging', or 'production'
  api: {
    baseUrl: string,             // API gateway URL
    timeout: number,             // Request timeout in milliseconds
    retryAttempts: number        // Number of retry attempts for failed requests
  },
  features: {
    enableLogging: boolean,      // Enable console logging
    enableDebugMode: boolean     // Enable debug mode
  }
};
```

## Running the Application

### Local Development
```bash
# Runs with environment.ts (localhost API)
npm start
# or
ionic serve
# or
ng serve
```

### Staging Environment
```bash
# Runs with environment.stg.ts (staging API)
ionic serve --configuration=staging
# or
ng serve --configuration=staging
```

### Production Build
```bash
# Builds with environment.prod.ts (production API)
ionic build --configuration=production
# or
ng build --configuration=production
```

## Building for Different Environments

### Build for Staging
```bash
ionic build --configuration=staging
# Output in: www/
```

### Build for Production
```bash
ionic build --configuration=production
# Output in: www/
```

### Capacitor Builds

#### iOS
```bash
# Build for staging
ionic build --configuration=staging
ionic cap sync ios
ionic cap open ios

# Build for production
ionic build --configuration=production
ionic cap sync ios
ionic cap open ios
```

#### Android
```bash
# Build for staging
ionic build --configuration=staging
ionic cap sync android
ionic cap open android

# Build for production
ionic build --configuration=production
ionic cap sync android
ionic cap open android
```

## Using the Environment Configuration in Code

### 1. Import EnvironmentConfig Service

```typescript
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';

@Injectable({
  providedIn: 'root'
})
export class MyService {
  constructor(private envConfig: EnvironmentConfig) {
    // Access environment properties
    console.log('Environment:', this.envConfig.environmentName);
    console.log('API URL:', this.envConfig.apiBaseUrl);
  }
}
```

### 2. Create Repository Using ApiBaseService

```typescript
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';

@Injectable({
  providedIn: 'root'
})
export class UserRepositoryImpl extends ApiBaseService {

  getUsers(): Observable<User[]> {
    // Automatically uses correct environment URL
    return this.get<User[]>('/users');
  }

  getUserById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.post<User>('/users', user);
  }
}
```

### 3. Build API URLs Manually

```typescript
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';

constructor(private envConfig: EnvironmentConfig) {
  // Build full URL
  const url = this.envConfig.buildApiUrl('/users');
  // Returns: http://localhost:8080/jbh-api/users (local)
  //      or: https://stg-api.yourdomain.com/jbh-api/users (staging)
  //      or: https://api.yourdomain.com/jbh-api/users (production)
}
```

## Updating API URLs

### For Staging
Edit `src/environments/environment.stg.ts`:
```typescript
api: {
  baseUrl: 'https://your-staging-server.com/jbh-api',
  timeout: 30000,
  retryAttempts: 3
}
```

### For Production
Edit `src/environments/environment.prod.ts`:
```typescript
api: {
  baseUrl: 'https://your-production-server.com/jbh-api',
  timeout: 30000,
  retryAttempts: 3
}
```

## Environment-Specific Features

The configuration also supports feature flags:

```typescript
if (this.envConfig.isLoggingEnabled) {
  console.log('This only logs in local/staging');
}

if (this.envConfig.isDebugModeEnabled) {
  // Show debug information
}
```

## Best Practices

1. **Never commit sensitive data** to environment files
   - Use placeholder values
   - Update actual values during deployment

2. **Use EnvironmentConfig service** instead of importing environment directly
   - Better testability
   - Centralized configuration access

3. **Extend ApiBaseService** for all HTTP repositories
   - Automatic environment-based URLs
   - Built-in retry logic
   - Centralized error handling

4. **Test each environment** before deployment
   ```bash
   # Test local
   ionic serve

   # Test staging
   ionic serve --configuration=staging
   ```

## Troubleshooting

### API not connecting
1. Check the environment file for the correct URL
2. Verify the API server is running
3. Check browser console for CORS errors
4. Ensure `HttpClientModule` is imported in your app

### Wrong environment loaded
1. Check your build/serve command includes the correct `--configuration` flag
2. Verify `angular.json` has the correct `fileReplacements` configuration
3. Clear browser cache and rebuild

### TypeScript errors
If you see import errors, update your `tsconfig.json` with path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["src/app/core/*"]
    }
  }
}
```

## Architecture

This setup follows **Hexagonal Architecture** principles:

```
src/app/
├── core/
│   ├── domain/              # Business logic (environment-agnostic)
│   │   └── repositories/    # Repository interfaces
│   └── infrastructure/      # External dependencies
│       ├── api/            # API base service
│       ├── config/         # Environment configuration
│       └── repositories/   # Repository implementations
```

The environment configuration is isolated in the infrastructure layer, keeping your domain logic clean and testable.
