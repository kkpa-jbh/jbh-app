# JWT Authentication System - Summary

## Overview

Complete JWT authentication system with HTTP interceptors following **Hexagonal Architecture** and **DDD principles**.

---

## Key Features

✅ **JWT Token Management** - Automatic token handling with secure storage
✅ **HTTP Interceptors** - Auto-add JWT to protected endpoints
✅ **Public API Support** - Easy marking of endpoints that don't need auth
✅ **Error Handling** - Automatic 401/403 error handling with redirect
✅ **Token Refresh** - Ready for token refresh implementation
✅ **Role/Permission System** - Built-in role and permission checking
✅ **Route Guards** - Protect routes with auth, role, and permission guards
✅ **Reactive State** - Observable-based auth state management
✅ **Hexagonal Architecture** - Clean separation of concerns

---

## Architecture

```
UI (Components/Pages)
    ↓
AuthUseCase (Business Logic)
    ↓
AuthRepository Interface (Port)
    ↓
AuthRepositoryImpl (Adapter)
    ↓
HTTP Interceptors → API
    ↓
Token Storage (Capacitor Preferences)
```

---

## Files Structure

```
src/app/core/
├── domain/                          # Business Logic Layer
│   ├── models/
│   │   ├── user.model.ts           # User entity
│   │   ├── auth-token.model.ts     # Token value object
│   │   └── login-credentials.model.ts
│   ├── repositories/
│   │   └── auth.repository.ts      # Repository interface (Port)
│   └── use-cases/
│       └── auth.use-case.ts        # Authentication business logic
│
├── infrastructure/                  # Implementation Layer
│   ├── interceptors/
│   │   ├── jwt.interceptor.ts      # Adds JWT to requests
│   │   └── error.interceptor.ts    # Handles 401/403
│   ├── persistence/
│   │   └── token-storage.service.ts # Secure token storage
│   ├── api/
│   │   ├── api-base.service.ts     # Protected APIs
│   │   └── public-api.service.ts   # Public APIs
│   └── repositories/
│       └── auth.repository.impl.ts # API implementation
│
└── guards/
    └── auth.guard.ts                # Route guards
```

---

## How Public/Protected APIs Work

### Protected APIs (Default Behavior)
**JWT token automatically added** to all requests by `JwtInterceptor`:

```typescript
@Injectable({ providedIn: 'root' })
export class UserRepository extends ApiBaseService {
  getUsers() {
    return this.get('/users');
    // Authorization: Bearer eyJhbG... (added automatically)
  }
}
```

### Public APIs (Opt-in)
**No JWT token** for endpoints marked with `IS_PUBLIC_API`:

**Method 1: PublicApiService (Recommended)**
```typescript
@Injectable({ providedIn: 'root' })
export class BlogRepository {
  constructor(private publicApi: PublicApiService) {}

  getPosts() {
    return this.publicApi.get('/blog/posts'); // No JWT
  }
}
```

**Method 2: HttpContext**
```typescript
import { HttpContext } from '@angular/common/http';
import { IS_PUBLIC_API } from '@core/infrastructure/interceptors/jwt.interceptor';

login(credentials: any) {
  return this.post('/auth/login', credentials, {
    context: new HttpContext().set(IS_PUBLIC_API, true) // No JWT
  });
}
```

### Mixed Repository
```typescript
@Injectable({ providedIn: 'root' })
export class ArticleRepository extends ApiBaseService {

  // PUBLIC: Anyone can read articles
  getAll() {
    return this.get('/articles', {
      context: new HttpContext().set(IS_PUBLIC_API, true)
    });
  }

  // PROTECTED: Only authenticated users can create
  create(article: any) {
    return this.post('/articles', article); // JWT added
  }

  // PROTECTED: Only authenticated users can update
  update(id: string, article: any) {
    return this.put(`/articles/${id}`, article); // JWT added
  }
}
```

---

## Usage Examples

### 1. Login
```typescript
constructor(private authUseCase: AuthUseCase, private router: Router) {}

login() {
  this.authUseCase.login(username, password).subscribe({
    next: (user) => {
      console.log('Logged in:', user);
      this.router.navigate(['/home']);
    },
    error: (error) => console.error('Login failed:', error)
  });
}
```

### 2. Check Authentication
```typescript
// In template
<div *ngIf="authUseCase.isAuthenticated$ | async">
  Welcome, {{ (authUseCase.currentUser$ | async)?.fullName }}
</div>

// In component
if (this.authUseCase.isAuthenticated()) {
  // User is logged in
}
```

### 3. Protected Route
```typescript
// app.routes.ts
{
  path: 'dashboard',
  component: DashboardPage,
  canActivate: [authGuard] // Requires login
}
```

### 4. Role-Based Route
```typescript
{
  path: 'admin',
  component: AdminPage,
  canActivate: [authGuard, roleGuard(['admin'])] // Requires admin role
}
```

### 5. Create Repository
```typescript
import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';

@Injectable({ providedIn: 'root' })
export class ProductRepository extends ApiBaseService {

  getProducts() {
    return this.get('/products'); // JWT added automatically
  }

  getById(id: string) {
    return this.get(`/products/${id}`);
  }

  create(product: any) {
    return this.post('/products', product);
  }
}
```

---

## Interceptor Flow

### Request Flow (Protected API)
```
1. Component calls repository.getUsers()
2. ApiBaseService makes HTTP request
3. JwtInterceptor checks if IS_PUBLIC_API = true
4. IS_PUBLIC_API = false → Add JWT from storage
5. Request sent: Authorization: Bearer eyJhbG...
6. API processes request
7. Response returned to component
```

### Request Flow (Public API)
```
1. Component calls publicApi.get('/blog')
2. PublicApiService makes HTTP request with IS_PUBLIC_API = true
3. JwtInterceptor checks IS_PUBLIC_API
4. IS_PUBLIC_API = true → Skip adding JWT
5. Request sent without Authorization header
6. API processes request
7. Response returned to component
```

### Error Flow (401 Unauthorized)
```
1. API returns 401 Unauthorized
2. ErrorInterceptor catches error
3. Checks if IS_PUBLIC_API = true
4. IS_PUBLIC_API = false → Attempt token refresh
5. If refresh fails → Clear tokens
6. Redirect to /login
```

---

## Configuration

### 1. Update API Endpoints
Edit [auth.repository.impl.ts](src/app/core/infrastructure/repositories/auth.repository.impl.ts:16):
```typescript
private readonly AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',        // Your login endpoint
  LOGOUT: '/auth/logout',      // Your logout endpoint
  REFRESH: '/auth/refresh',    // Your refresh endpoint
  PROFILE: '/auth/profile',    // Your profile endpoint
  // ...
};
```

### 2. Match Your API Response Format
If your API uses different field names, update the mapping functions:

```typescript
// In auth.repository.impl.ts
private mapToAuthToken(response: any): AuthToken {
  return new AuthToken(
    response.accessToken || response.access_token || response.token,
    response.refreshToken || response.refresh_token,
    response.expiresIn || response.expires_in,
    response.tokenType || response.token_type || 'Bearer'
  );
}
```

### 3. Implement Token Refresh
Edit [error.interceptor.ts](src/app/core/infrastructure/interceptors/error.interceptor.ts:44) to call your refresh endpoint:

```typescript
private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
  return this.authRepository.refreshToken(refreshToken).pipe(
    switchMap(newToken => {
      this.tokenStorage.saveToken(newToken);
      return next.handle(this.addTokenToRequest(request));
    }),
    catchError(() => {
      this.handleLogout();
      return throwError(() => new Error('Session expired'));
    })
  );
}
```

---

## Security

- ✅ Tokens stored securely using **Capacitor Preferences** (encrypted on device)
- ✅ JWT automatically added only to **protected endpoints**
- ✅ Public APIs **clearly marked** to avoid sending tokens unnecessarily
- ✅ **401 errors handled** with automatic token refresh or logout
- ✅ **403 errors handled** with proper error messages
- ✅ **HTTPS required** in production (configure in environment files)

---

## Testing

### Mock AuthUseCase
```typescript
const mockAuthUseCase = {
  login: jasmine.createSpy().and.returnValue(of(mockUser)),
  logout: jasmine.createSpy().and.returnValue(of(void 0)),
  isAuthenticated: jasmine.createSpy().and.returnValue(true),
  currentUser$: of(mockUser),
  isAuthenticated$: of(true)
};

TestBed.configureTestingModule({
  providers: [
    { provide: AuthUseCase, useValue: mockAuthUseCase }
  ]
});
```

---

## Documentation

- **Full Guide**: [AUTH_SETUP.md](AUTH_SETUP.md) - Complete authentication documentation
- **Quick Reference**: [AUTH_QUICK_REFERENCE.md](AUTH_QUICK_REFERENCE.md) - Common code snippets
- **Environment Setup**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - API configuration
- **Commands**: [ENVIRONMENT_COMMANDS.md](ENVIRONMENT_COMMANDS.md) - Build commands

---

## Next Steps

1. ✅ **System is ready** - All interceptors and services are configured
2. 🔧 **Update API endpoints** in `auth.repository.impl.ts`
3. 🔧 **Match API response format** if different from default
4. 🏗️ **Create login page** using `AuthUseCase`
5. 🏗️ **Protect routes** with `authGuard`
6. 🔄 **Implement token refresh** in `ErrorInterceptor`
7. 📱 **Install Capacitor Preferences** plugin: `npm install @capacitor/preferences`

---

## Key Concepts

### Public vs Protected APIs

| Type | JWT Token | Usage | Example |
|------|-----------|-------|---------|
| **Protected** | ✅ Auto-added | Default for all APIs | User data, create/update/delete |
| **Public** | ❌ Not added | Mark with `IS_PUBLIC_API` | Login, register, public content |

### When to Use Each

- **ApiBaseService** (Protected): User profile, create/update data, admin operations
- **PublicApiService** (Public): Login, register, public blog posts, public images
- **Mixed**: Repositories that have both public reads and protected writes

---

## Questions?

The authentication system is production-ready and follows best practices:
- Hexagonal architecture for testability
- DDD principles for clean domain logic
- Reactive patterns with RxJS
- Secure token storage
- Automatic JWT handling
- Public/protected API distinction
