import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { tap, switchMap, catchError, map } from 'rxjs/operators';
import { AuthRepository } from '../repositories/auth.repository';
import { User } from '../models/user.model';
import { AuthToken } from '../models/auth-token.model';
import { LoginCredentials } from '../models/login-credentials.model';
import { TokenStorageService } from '../../infrastructure/persistence/token-storage.service';

/**
 * Authentication Use Case
 * Contains business logic for authentication operations
 * Acts as the application service layer between UI and repositories
 */
@Injectable({
  providedIn: 'root'
})
export class AuthUseCase {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private authRepository: AuthRepository,
    private tokenStorage: TokenStorageService
  ) {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored token
   */
  private initializeAuthState(): void {
    from(this.tokenStorage.hasToken()).pipe(
      switchMap(hasToken => {
        if (hasToken) {
          return this.loadCurrentUser();
        }
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        if (user) {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        }
      },
      error: () => {
        // Token might be invalid, clear it
        this.tokenStorage.clearTokens();
      }
    });
  }

  /**
   * Login with credentials
   * @param username - Username
   * @param password - Password
   */
  login(username: string, password: string): Observable<User> {
    const credentials = new LoginCredentials(username, password);

    return this.authRepository.login(credentials).pipe(
      switchMap(token => {
        // Save token to storage
        return from(this.tokenStorage.saveToken(token)).pipe(
          map(() => token)
        );
      }),
      switchMap(() => {
        // Load user profile
        return this.loadCurrentUser();
      }),
      tap(user => {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): Observable<void> {
    return this.authRepository.logout().pipe(
      switchMap(() => from(this.tokenStorage.clearTokens())),
      tap(() => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }),
      catchError(() => {
        // Even if API call fails, clear local tokens
        return from(this.tokenStorage.clearTokens()).pipe(
          tap(() => {
            this.currentUserSubject.next(null);
            this.isAuthenticatedSubject.next(false);
          })
        );
      })
    );
  }

  /**
   * Register new user
   * @param userData - User registration data
   */
  register(userData: any): Observable<User> {
    return this.authRepository.register(userData);
  }

  /**
   * Load current user profile
   */
  loadCurrentUser(): Observable<User> {
    return this.authRepository.getCurrentUser().pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<AuthToken> {
    return from(this.tokenStorage.getRefreshToken()).pipe(
      switchMap(refreshToken => {
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        return this.authRepository.refreshToken(refreshToken);
      }),
      switchMap(token => {
        return from(this.tokenStorage.saveToken(token)).pipe(
          map(() => token)
        );
      })
    );
  }

  /**
   * Verify email with token
   * @param token - Verification token
   */
  verifyEmail(token: string): Observable<void> {
    return this.authRepository.verifyEmail(token);
  }

  /**
   * Request password reset
   * @param email - User email
   */
  requestPasswordReset(email: string): Observable<void> {
    return this.authRepository.requestPasswordReset(email);
  }

  /**
   * Reset password with token
   * @param token - Reset token
   * @param newPassword - New password
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.authRepository.resetPassword(token, newPassword);
  }

  /**
   * Get current user synchronously
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Check if current user has a specific role
   * @param role - Role to check
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.hasRole(role) ?? false;
  }

  /**
   * Check if current user has any of the specified roles
   * @param roles - Roles to check
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user?.hasAnyRole(roles) ?? false;
  }

  /**
   * Check if current user has a specific permission
   * @param permission - Permission to check
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.hasPermission(permission) ?? false;
  }
}
