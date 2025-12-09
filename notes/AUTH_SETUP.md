# JWT Authentication Setup Guide

Complete JWT authentication system with HTTP interceptors and support for public/protected APIs.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│  (Components/Pages use AuthUseCase)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
│  AuthUseCase (Business Logic)                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│  AuthRepository Interface (Port)                           │
│  User, AuthToken, LoginCredentials Models                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │ JWT          │  │ Error         │  │ AuthRepository  │ │
│  │ Interceptor  │  │ Interceptor   │  │ Impl            │ │
│  └──────────────┘  └───────────────┘  └─────────────────┘ │
│  ┌──────────────┐  ┌───────────────┐                      │
│  │ Token        │  │ ApiBase       │                      │
│  │ Storage      │  │ Service       │                      │
│  └──────────────┘  └───────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Created

### Domain Layer (Business Logic)
- [user.model.ts](src/app/core/domain/models/user.model.ts) - User entity with roles/permissions
- [auth-token.model.ts](src/app/core/domain/models/auth-token.model.ts) - JWT token value object
- [login-credentials.model.ts](src/app/core/domain/models/login-credentials.model.ts) - Login credentials
- [auth.repository.ts](src/app/core/domain/repositories/auth.repository.ts) - Auth repository interface (port)
- [auth.use-case.ts](src/app/core/domain/use-cases/auth.use-case.ts) - Authentication use case (business logic)

### Infrastructure Layer (Implementation)
- [jwt.interceptor.ts](src/app/core/infrastructure/interceptors/jwt.interceptor.ts) - Adds JWT to requests
- [error.interceptor.ts](src/app/core/infrastructure/interceptors/error.interceptor.ts) - Handles 401/403 errors
- [token-storage.service.ts](src/app/core/infrastructure/persistence/token-storage.service.ts) - Secure token storage
- [auth.repository.impl.ts](src/app/core/infrastructure/repositories/auth.repository.impl.ts) - Auth API implementation
- [public-api.service.ts](src/app/core/infrastructure/api/public-api.service.ts) - Helper for public APIs

### Configuration
- [main.ts](src/main.ts:20-25) - Interceptors registered

---

## How It Works

### 1. JWT Interceptor
Automatically adds JWT token to **all HTTP requests** except those marked as public.

### 2. Error Interceptor
- **401 Unauthorized**: Attempts token refresh, or redirects to login
- **403 Forbidden**: Handles permission errors

### 3. Public vs Protected APIs

#### Protected APIs (Default)
All API calls **automatically include JWT token**:
```typescript
@Injectable({ providedIn: 'root' })
export class UserRepository extends ApiBaseService {
  getUsers() {
    return this.get('/users'); // JWT automatically added
  }
}
```

#### Public APIs (No Auth Required)
Mark specific requests as public using `IS_PUBLIC_API` context:

**Method 1: Using HttpContext directly**
```typescript
import { HttpContext } from '@angular/common/http';
import { IS_PUBLIC_API } from '@core/infrastructure/interceptors/jwt.interceptor';

this.http.post('/auth/login', credentials, {
  context: new HttpContext().set(IS_PUBLIC_API, true)
}); // No JWT token added
```

**Method 2: Using PublicApiService**
```typescript
import { PublicApiService } from '@core/infrastructure/api/public-api.service';

@Injectable({ providedIn: 'root' })
export class PublicDataRepository {
  constructor(private publicApi: PublicApiService) {}

  getPublicData() {
    return this.publicApi.get('/public/data'); // No JWT required
  }
}
```

---

## Usage Examples

### 1. Login (In a Component or Page)

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html'
})
export class LoginPage {
  username = '';
  password = '';

  constructor(
    private authUseCase: AuthUseCase,
    private router: Router
  ) {}

  login() {
    this.authUseCase.login(this.username, this.password).subscribe({
      next: (user) => {
        console.log('Logged in:', user);
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Login failed:', error);
      }
    });
  }
}
```

### 2. Logout

```typescript
logout() {
  this.authUseCase.logout().subscribe({
    next: () => {
      this.router.navigate(['/login']);
    }
  });
}
```

### 3. Check Authentication State

```typescript
import { Component, OnInit } from '@angular/core';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html'
})
export class DashboardPage implements OnInit {
  currentUser$ = this.authUseCase.currentUser$;
  isAuthenticated$ = this.authUseCase.isAuthenticated$;

  constructor(private authUseCase: AuthUseCase) {}

  ngOnInit() {
    // Subscribe to auth state
    this.isAuthenticated$.subscribe(isAuth => {
      console.log('Is authenticated:', isAuth);
    });

    // Or check synchronously
    if (this.authUseCase.isAuthenticated()) {
      console.log('User is logged in');
    }
  }
}
```

### 4. Protected API Call (Automatically Includes JWT)

```typescript
import { Injectable } from '@angular/core';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';

@Injectable({ providedIn: 'root' })
export class ProductRepository extends ApiBaseService {

  getProducts() {
    // JWT token automatically added by JwtInterceptor
    return this.get('/products');
  }

  getProductById(id: string) {
    return this.get(`/products/${id}`);
  }
}
```

### 5. Public API Call (No JWT Required)

```typescript
import { Injectable } from '@angular/core';
import { PublicApiService } from '@core/infrastructure/api/public-api.service';

@Injectable({ providedIn: 'root' })
export class PublicContentRepository {

  constructor(private publicApi: PublicApiService) {}

  getPublicContent() {
    // No JWT token added
    return this.publicApi.get('/public/content');
  }

  getBlogPosts() {
    return this.publicApi.get('/public/blog');
  }
}
```

### 6. Mixed Repository (Some Public, Some Protected)

```typescript
import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { IS_PUBLIC_API } from '@core/infrastructure/interceptors/jwt.interceptor';

@Injectable({ providedIn: 'root' })
export class ArticleRepository extends ApiBaseService {

  // Public: Get all articles (no auth needed)
  getPublicArticles() {
    return this.get('/articles', {
      context: new HttpContext().set(IS_PUBLIC_API, true)
    });
  }

  // Protected: Get user's articles (requires JWT)
  getMyArticles() {
    return this.get('/articles/my');
  }

  // Protected: Create article (requires JWT)
  createArticle(article: any) {
    return this.post('/articles', article);
  }
}
```

### 7. Check User Roles/Permissions

```typescript
import { Component } from '@angular/core';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div *ngIf="isAdmin">
      <h1>Admin Panel</h1>
    </div>
  `
})
export class AdminPanelComponent {
  isAdmin = false;

  constructor(private authUseCase: AuthUseCase) {
    // Check if user has admin role
    this.isAdmin = this.authUseCase.hasRole('admin');

    // Check if user has any of these roles
    const canAccess = this.authUseCase.hasAnyRole(['admin', 'moderator']);

    // Check specific permission
    const canDelete = this.authUseCase.hasPermission('delete:users');
  }
}
```

---

## Authentication Flow

### Login Flow
```
1. User enters credentials
2. Component calls AuthUseCase.login()
3. AuthUseCase calls AuthRepository.login() [PUBLIC API]
4. API returns JWT token
5. Token saved to secure storage (Capacitor Preferences)
6. User profile loaded
7. AuthUseCase emits user and authenticated state
8. Navigate to home
```

### Protected API Call Flow
```
1. Component calls repository method
2. ApiBaseService makes HTTP request
3. JwtInterceptor intercepts request
4. Checks if IS_PUBLIC_API is set
5. If not public, adds JWT token from storage
6. Request sent with Authorization header
7. Response returned to component
```

### 401 Error Flow
```
1. API returns 401 Unauthorized
2. ErrorInterceptor catches error
3. Checks if IS_PUBLIC_API is set
4. If not public, attempts token refresh
5. If refresh fails, clears tokens
6. Redirects to /login
```

---

## API Endpoint Configuration

Update your API endpoints in [auth.repository.impl.ts](src/app/core/infrastructure/repositories/auth.repository.impl.ts:16):

```typescript
private readonly AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',              // POST - Login
  LOGOUT: '/auth/logout',            // POST - Logout
  REFRESH: '/auth/refresh',          // POST - Refresh token
  REGISTER: '/auth/register',        // POST - Register
  PROFILE: '/auth/profile',          // GET - Get user profile
  VERIFY_EMAIL: '/auth/verify-email', // POST - Verify email
  REQUEST_PASSWORD_RESET: '/auth/request-password-reset', // POST
  RESET_PASSWORD: '/auth/reset-password' // POST
};
```

---

## Expected API Response Formats

### Login/Refresh Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

## Security Best Practices

1. **Tokens stored securely** using Capacitor Preferences (encrypted on device)
2. **JWT automatically added** to protected endpoints
3. **Public APIs clearly marked** to avoid sending tokens unnecessarily
4. **401 errors handled** with automatic redirect to login
5. **Token refresh** logic ready (implement in ErrorInterceptor)
6. **HTTPS required** in production (configure in environment files)

---

## Interceptor Order

Interceptors execute in order of registration:

1. **JwtInterceptor** - Adds token
2. **ErrorInterceptor** - Handles errors

This order ensures tokens are added before error handling occurs.

---

## Testing

### Mock AuthUseCase in Tests
```typescript
const mockAuthUseCase = {
  login: jasmine.createSpy().and.returnValue(of(mockUser)),
  logout: jasmine.createSpy().and.returnValue(of(void 0)),
  isAuthenticated: jasmine.createSpy().and.returnValue(true),
  currentUser$: of(mockUser)
};

TestBed.configureTestingModule({
  providers: [
    { provide: AuthUseCase, useValue: mockAuthUseCase }
  ]
});
```

---

## Troubleshooting

### Token not being added to requests
- Check that endpoint is NOT marked with `IS_PUBLIC_API`
- Verify token exists in storage: `TokenStorageService.getAccessToken()`
- Check browser/app console for interceptor errors

### 401 errors not redirecting to login
- Verify `ErrorInterceptor` is registered in main.ts
- Check router is imported and `/login` route exists

### Public API still getting 401
- Ensure request uses `IS_PUBLIC_API` context
- Or use `PublicApiService` instead of `ApiBaseService`

---

## Next Steps

1. **Create login page** using AuthUseCase
2. **Create auth guard** to protect routes
3. **Implement token refresh** logic in ErrorInterceptor
4. **Add loading indicators** during auth operations
5. **Handle offline scenarios** for mobile apps

---

## Additional Resources

- [Environment Setup](ENVIRONMENT_SETUP.md)
- [Quick Commands](ENVIRONMENT_COMMANDS.md)
- Capacitor Preferences: https://capacitorjs.com/docs/apis/preferences
