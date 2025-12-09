# JWT Authentication - Quick Reference

## Import Statements

```typescript
// Use Case (Business Logic)
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';

// For Public APIs
import { PublicApiService } from '@core/infrastructure/api/public-api.service';
import { IS_PUBLIC_API } from '@core/infrastructure/interceptors/jwt.interceptor';

// For Protected APIs
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';

// Guards
import { authGuard, roleGuard, permissionGuard, guestGuard } from '@core/guards/auth.guard';

// Models
import { User } from '@core/domain/models/user.model';
import { AuthToken } from '@core/domain/models/auth-token.model';
```

---

## Common Tasks

### Login
```typescript
constructor(private authUseCase: AuthUseCase) {}

login() {
  this.authUseCase.login(username, password).subscribe({
    next: (user) => console.log('Logged in', user),
    error: (err) => console.error('Login failed', err)
  });
}
```

### Logout
```typescript
logout() {
  this.authUseCase.logout().subscribe(() => {
    this.router.navigate(['/login']);
  });
}
```

### Check Authentication
```typescript
// Observable
isAuthenticated$ = this.authUseCase.isAuthenticated$;

// Synchronous
if (this.authUseCase.isAuthenticated()) {
  // User is logged in
}
```

### Get Current User
```typescript
// Observable
currentUser$ = this.authUseCase.currentUser$;

// Synchronous
const user = this.authUseCase.getCurrentUser();
```

### Check Roles
```typescript
// Single role
if (this.authUseCase.hasRole('admin')) { }

// Any of these roles
if (this.authUseCase.hasAnyRole(['admin', 'moderator'])) { }
```

### Check Permissions
```typescript
if (this.authUseCase.hasPermission('delete:users')) { }
```

---

## API Calls

### Protected API (JWT Automatically Added)
```typescript
@Injectable({ providedIn: 'root' })
export class MyRepository extends ApiBaseService {
  getData() {
    return this.get('/data'); // JWT added automatically
  }
}
```

### Public API (No JWT)

**Option 1: Use PublicApiService**
```typescript
@Injectable({ providedIn: 'root' })
export class MyRepository {
  constructor(private publicApi: PublicApiService) {}

  getPublicData() {
    return this.publicApi.get('/public/data'); // No JWT
  }
}
```

**Option 2: Use HttpContext**
```typescript
import { HttpContext } from '@angular/common/http';
import { IS_PUBLIC_API } from '@core/infrastructure/interceptors/jwt.interceptor';

return this.get('/public/data', {
  context: new HttpContext().set(IS_PUBLIC_API, true)
});
```

### Mixed (Some Public, Some Protected)
```typescript
@Injectable({ providedIn: 'root' })
export class ArticleRepository extends ApiBaseService {

  // Public
  getAll() {
    return this.get('/articles', {
      context: new HttpContext().set(IS_PUBLIC_API, true)
    });
  }

  // Protected
  create(article: any) {
    return this.post('/articles', article); // JWT added
  }
}
```

---

## Route Guards

### Protect Route (Requires Login)
```typescript
// app.routes.ts
{
  path: 'dashboard',
  component: DashboardPage,
  canActivate: [authGuard]
}
```

### Role-Based Protection
```typescript
{
  path: 'admin',
  component: AdminPage,
  canActivate: [authGuard, roleGuard(['admin'])]
}
```

### Permission-Based Protection
```typescript
{
  path: 'users/delete',
  component: DeleteUserPage,
  canActivate: [authGuard, permissionGuard('delete:users')]
}
```

### Guest Only (Login/Register Pages)
```typescript
{
  path: 'login',
  component: LoginPage,
  canActivate: [guestGuard] // Redirect to /home if already logged in
}
```

---

## Template Examples

### Show/Hide Based on Auth
```html
<div *ngIf="authUseCase.isAuthenticated$ | async">
  <p>Welcome, {{ (authUseCase.currentUser$ | async)?.fullName }}</p>
  <ion-button (click)="logout()">Logout</ion-button>
</div>

<div *ngIf="!(authUseCase.isAuthenticated$ | async)">
  <ion-button routerLink="/login">Login</ion-button>
</div>
```

### Role-Based UI
```html
<ion-button *ngIf="authUseCase.hasRole('admin')">
  Admin Panel
</ion-button>
```

---

## API Response Formats

### Login Response (Expected from API)
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### User Profile Response
```json
{
  "id": "123",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["user", "admin"],
  "permissions": ["read:users", "write:articles"]
}
```

---

## Configuration

### Update API Endpoints
Edit: [auth.repository.impl.ts](src/app/core/infrastructure/repositories/auth.repository.impl.ts)
```typescript
private readonly AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  // ...
};
```

### Change Token Storage Keys
Edit: [token-storage.service.ts](src/app/core/infrastructure/persistence/token-storage.service.ts)
```typescript
private readonly TOKEN_KEY = 'auth_token';
private readonly REFRESH_TOKEN_KEY = 'refresh_token';
```

---

## Debugging

### Check if Token Exists
```typescript
import { TokenStorageService } from '@core/infrastructure/persistence/token-storage.service';

constructor(private tokenStorage: TokenStorageService) {
  this.tokenStorage.getAccessToken().then(token => {
    console.log('Token:', token);
  });
}
```

### Monitor Auth State
```typescript
constructor(private authUseCase: AuthUseCase) {
  this.authUseCase.isAuthenticated$.subscribe(isAuth => {
    console.log('Is Authenticated:', isAuth);
  });

  this.authUseCase.currentUser$.subscribe(user => {
    console.log('Current User:', user);
  });
}
```

---

## Common Issues

**Q: JWT not being added to request**
A: Make sure endpoint is NOT marked with `IS_PUBLIC_API`

**Q: Getting 401 on login**
A: Login should use `IS_PUBLIC_API` context

**Q: Token persists after logout**
A: Call `authUseCase.logout()` which clears storage

**Q: User state not updating**
A: Subscribe to `currentUser$` observable

---

## File Locations

- **Use Case**: `src/app/core/domain/use-cases/auth.use-case.ts`
- **Guards**: `src/app/core/guards/auth.guard.ts`
- **Interceptors**: `src/app/core/infrastructure/interceptors/`
- **Token Storage**: `src/app/core/infrastructure/persistence/token-storage.service.ts`
- **Models**: `src/app/core/domain/models/`

---

## Full Documentation
See [AUTH_SETUP.md](AUTH_SETUP.md) for complete guide.
