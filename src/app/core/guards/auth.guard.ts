import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthUseCase } from '../domain/use-cases/auth.use-case';
import { map, take, filter, switchMap } from 'rxjs/operators';

/**
 * Auth Guard
 * Protects routes that require authentication
 *
 * Usage in routes:
 * {
 *   path: 'dashboard',
 *   component: DashboardPage,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authUseCase = inject(AuthUseCase);
  const router = inject(Router);

  // Wait for auth initialization to complete before checking auth status
  return authUseCase.authInitialized$.pipe(
    filter(initialized => initialized), // Wait until initialized
    take(1),
    switchMap(() => authUseCase.isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }

      // Store the attempted URL for redirecting after login
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    })
  );
};

/**
 * Role Guard Factory
 * Protects routes that require specific roles
 *
 * Usage:
 * {
 *   path: 'admin',
 *   component: AdminPage,
 *   canActivate: [roleGuard(['admin'])]
 * }
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const authUseCase = inject(AuthUseCase);
    const router = inject(Router);

    const hasRole = authUseCase.hasAnyRole(allowedRoles);

    if (hasRole) {
      return true;
    }

    // Redirect to access denied or home
    router.navigate(['/access-denied']);
    return false;
  };
}

/**
 * Permission Guard Factory
 * Protects routes that require specific permissions
 *
 * Usage:
 * {
 *   path: 'users/delete',
 *   component: DeleteUserPage,
 *   canActivate: [permissionGuard('delete:users')]
 * }
 */
export function permissionGuard(requiredPermission: string): CanActivateFn {
  return (route, state) => {
    const authUseCase = inject(AuthUseCase);
    const router = inject(Router);

    const hasPermission = authUseCase.hasPermission(requiredPermission);

    if (hasPermission) {
      return true;
    }

    router.navigate(['/access-denied']);
    return false;
  };
}

/**
 * Guest Guard
 * Prevents authenticated users from accessing login/register pages
 * Redirects to home if already logged in
 *
 * Usage:
 * {
 *   path: 'login',
 *   component: LoginPage,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authUseCase = inject(AuthUseCase);
  const router = inject(Router);

  // Wait for auth initialization to complete before checking auth status
  return authUseCase.authInitialized$.pipe(
    filter(initialized => initialized), // Wait until initialized
    take(1),
    switchMap(() => authUseCase.isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      }

      // Already logged in, redirect to dashboard
      router.navigate(['/dashboard']);
      return false;
    })
  );
};

/**
 * Root Redirect Guard
 * Redirects to dashboard if authenticated, login if not
 * Use this on the root path ('') to handle initial navigation
 *
 * Usage:
 * {
 *   path: '',
 *   canActivate: [rootRedirectGuard]
 * }
 */
export const rootRedirectGuard: CanActivateFn = (route, state) => {
  const authUseCase = inject(AuthUseCase);
  const router = inject(Router);

  // Wait for auth initialization to complete before checking auth status
  return authUseCase.authInitialized$.pipe(
    filter(initialized => initialized), // Wait until initialized
    take(1),
    switchMap(() => authUseCase.isAuthenticated$),
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        router.navigate(['/dashboard']);
      } else {
        router.navigate(['/login']);
      }
      return false; // Don't activate route, just redirect
    })
  );
};
