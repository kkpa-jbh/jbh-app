# Environment Configuration Summary

## What Was Created

Your Ionic/Angular application now supports **three separate environments**:

### 1. Local Development
- **File**: `src/environments/environment.ts`
- **API**: `http://localhost:8080/jbh-api`
- **Command**: `ionic serve`

### 2. Staging (STG)
- **File**: `src/environments/environment.stg.ts`
- **API**: `https://stg-api.yourdomain.com/jbh-api` *(update this)*
- **Command**: `ionic serve --configuration=staging`

### 3. Production (PROD)
- **File**: `src/environments/environment.prod.ts`
- **API**: `https://api.yourdomain.com/jbh-api` *(update this)*
- **Command**: `ionic build --configuration=production`

---

## Files Created

```
jbh-app/
├── src/
│   ├── environments/
│   │   ├── environment.ts              # Local config (localhost)
│   │   ├── environment.stg.ts          # Staging config (NEW)
│   │   └── environment.prod.ts         # Production config (UPDATED)
│   │
│   └── app/
│       └── core/
│           └── infrastructure/
│               ├── config/
│               │   └── environment.config.ts      # Environment service
│               ├── api/
│               │   └── api-base.service.ts        # Base HTTP service
│               └── repositories/
│                   └── example.repository.impl.ts # Usage example
│
├── angular.json                         # UPDATED with staging config
├── tsconfig.json                        # UPDATED with path aliases
├── ENVIRONMENT_SETUP.md                 # Detailed documentation
├── ENVIRONMENT_COMMANDS.md              # Quick reference
└── README_ENVIRONMENTS.md               # This file
```

---

## How It Works

### Architecture Flow
```
Your Repository
    ↓ extends
ApiBaseService
    ↓ uses
EnvironmentConfig
    ↓ reads
environment.ts (or .stg.ts or .prod.ts based on build)
    ↓ provides
API URL for current environment
```

### Example Usage

**Step 1**: Create a repository extending ApiBaseService

```typescript
// src/app/core/infrastructure/repositories/user.repository.impl.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { User } from '@core/domain/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserRepositoryImpl extends ApiBaseService {

  getUsers(): Observable<User[]> {
    return this.get<User[]>('/users');
    // Local: http://localhost:8080/jbh-api/users
    // Staging: https://stg-api.yourdomain.com/jbh-api/users
    // Production: https://api.yourdomain.com/jbh-api/users
  }

  getUserById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.post<User>('/users', user);
  }

  updateUser(id: string, user: User): Observable<User> {
    return this.put<User>(`/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.delete<void>(`/users/${id}`);
  }
}
```

**Step 2**: Use in your service or component

```typescript
import { UserRepositoryImpl } from '@core/infrastructure/repositories/user.repository.impl';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private userRepo: UserRepositoryImpl) {}

  loadUsers() {
    return this.userRepo.getUsers();
  }
}
```

---

## Next Steps

### 1. Update API URLs

**For Staging**, edit [src/environments/environment.stg.ts](src/environments/environment.stg.ts:5):
```typescript
baseUrl: 'https://YOUR-STAGING-SERVER/jbh-api',
```

**For Production**, edit [src/environments/environment.prod.ts](src/environments/environment.prod.ts:5):
```typescript
baseUrl: 'https://YOUR-PRODUCTION-SERVER/jbh-api',
```

### 2. Test Each Environment

```bash
# Test local
ionic serve

# Test staging
ionic serve --configuration=staging

# Build production
ionic build --configuration=production
```

### 3. Create Your Repositories

Follow the hexagonal architecture pattern:

1. Create domain repository interface in `src/app/core/domain/repositories/`
2. Create repository implementation in `src/app/core/infrastructure/repositories/` extending `ApiBaseService`
3. Register in your module providers

---

## Benefits

✅ **Environment Separation**: Clean separation between local, staging, and production
✅ **DRY Principle**: No duplicate code - API logic in one place
✅ **Error Handling**: Built-in retry logic and error handling
✅ **Timeout Management**: Configurable request timeouts
✅ **Type Safety**: Full TypeScript support
✅ **Hexagonal Architecture**: Infrastructure isolated from domain logic
✅ **Easy Testing**: Mock ApiBaseService for unit tests

---

## Important Notes

1. **Never commit sensitive URLs** to version control
2. **Use environment variables** in CI/CD for production URLs
3. **Test each environment** before deploying
4. All HTTP calls should extend `ApiBaseService`
5. Import using path aliases: `@core/*`, `@features/*`, `@shared/*`

---

## Troubleshooting

**Problem**: API not connecting
**Solution**: Check the environment file has the correct URL and the server is running

**Problem**: Wrong API being called
**Solution**: Verify you're using the correct `--configuration` flag

**Problem**: TypeScript import errors
**Solution**: Make sure to use path aliases like `@core/infrastructure/api/api-base.service`

---

## Documentation

- **Full Guide**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Quick Commands**: [ENVIRONMENT_COMMANDS.md](ENVIRONMENT_COMMANDS.md)

---

## Questions?

The setup follows Angular and Ionic best practices with hexagonal architecture principles. All API calls automatically use the correct environment-based URL without any extra configuration needed in your code.
