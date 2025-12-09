# Quick Environment Commands Reference

## Development (Local)
```bash
# Start dev server with localhost API
ionic serve
# or
npm start
```
**API URL**: `http://localhost:8080/jbh-api`

---

## Staging
```bash
# Start dev server with staging API
ionic serve --configuration=staging

# Build for staging
ionic build --configuration=staging

# Build and sync for iOS staging
ionic build --configuration=staging && ionic cap sync ios && ionic cap open ios

# Build and sync for Android staging
ionic build --configuration=staging && ionic cap sync android && ionic cap open android
```
**API URL**: `https://stg-api.yourdomain.com/jbh-api` (update in `environment.stg.ts`)

---

## Production
```bash
# Build for production
ionic build --configuration=production

# Build and sync for iOS production
ionic build --configuration=production && ionic cap sync ios && ionic cap open ios

# Build and sync for Android production
ionic build --configuration=production && ionic cap sync android && ionic cap open android
```
**API URL**: `https://api.yourdomain.com/jbh-api` (update in `environment.prod.ts`)

---

## Update API URLs

### Staging API
Edit: `src/environments/environment.stg.ts`
```typescript
api: {
  baseUrl: 'https://YOUR-STAGING-URL/jbh-api',
  timeout: 30000,
  retryAttempts: 3
}
```

### Production API
Edit: `src/environments/environment.prod.ts`
```typescript
api: {
  baseUrl: 'https://YOUR-PRODUCTION-URL/jbh-api',
  timeout: 30000,
  retryAttempts: 3
}
```

---

## Using in Code

```typescript
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';

@Injectable({ providedIn: 'root' })
export class MyRepository extends ApiBaseService {
  getUsers() {
    // Automatically uses the correct environment URL
    return this.get('/users');
  }
}
```
