import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpContext } from '@angular/common/http';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { User } from '../../domain/models/user.model';
import { AuthToken } from '../../domain/models/auth-token.model';
import { LoginCredentials } from '../../domain/models/login-credentials.model';
import { ApiBaseService } from '../api/api-base.service';
import { IS_PUBLIC_API } from '../interceptors/jwt.interceptor';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '../config/environment.config';
import { LoggerService } from '../logging/logger.service';

/**
 * Authentication repository implementation
 * Handles all authentication-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl extends ApiBaseService implements AuthRepository {

  private readonly AUTH_ENDPOINTS = {
    LOGIN: '/auth/signin',
    LOGIN_GOOGLE: '/auth/google',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/signup',
    PROFILE: '/users/userinfo',
    VERIFY_EMAIL: '/auth/verify-email',
    REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
    RESET_PASSWORD: '/auth/reset-password',
    CHECK_USERNAME: '/auth/checkUsernameAvailability',
    CHECK_EMAIL: '/auth/checkEmailAvailability'
  };

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  /**
   * Login with credentials
   * This is a PUBLIC API - no JWT token required
   */
  login(credentials: LoginCredentials): Observable<AuthToken> {
    return this.post<any>(
      this.AUTH_ENDPOINTS.LOGIN,
      {
        usernameOrEmail: credentials.username,
        password: credentials.password
      },
      {
        context: new HttpContext().set(IS_PUBLIC_API, true) // Mark as public API
      }
    ).pipe(
      map(response => this.mapToAuthToken(response))
    );
  }

  /**
   * Login with a Google ID token
   * This is a PUBLIC API - the backend verifies the token with Google
   */
  loginWithGoogle(idToken: string): Observable<AuthToken> {
    return this.post<any>(
      this.AUTH_ENDPOINTS.LOGIN_GOOGLE,
      { idToken },
      {
        context: new HttpContext().set(IS_PUBLIC_API, true)
      }
    ).pipe(
      map(response => this.mapToAuthToken(response))
    );
  }

  /**
   * Refresh authentication token
   * This is a PUBLIC API - uses refresh token, not access token
   *
   * @param refreshToken - Optional refresh token (for mobile apps)
   *                       If not provided, expects refresh token from HTTP-only cookies (web/PWA)
   */
  refreshToken(refreshToken?: string): Observable<AuthToken> {
    // For web: refresh token comes from HTTP-only cookie (don't send in body)
    // For mobile: refresh token comes from secure storage (send in body)
    const body = refreshToken ? { refreshToken } : {};

    return this.post<any>(
      this.AUTH_ENDPOINTS.REFRESH,
      body,
      {
        context: new HttpContext().set(IS_PUBLIC_API, true) // Mark as public API
      }
    ).pipe(
      map(response => this.mapToAuthToken(response))
    );
  }

  /**
   * Logout current user
   * This is a PROTECTED API - requires JWT token
   */
  logout(): Observable<void> {
    return this.post<void>(this.AUTH_ENDPOINTS.LOGOUT, {});
  }

  /**
   * Get current user profile
   * This is a PROTECTED API - requires JWT token
   */
  getCurrentUser(): Observable<User> {
    return this.get<any>(this.AUTH_ENDPOINTS.PROFILE).pipe(
      map(response => this.mapToUser(response))
    );
  }

  /**
   * Register new user
   * This is a PUBLIC API - no JWT token required
   */
  register(userData: any): Observable<User> {
    return this.post<any>(
      this.AUTH_ENDPOINTS.REGISTER,
      userData,
      {
        context: new HttpContext().set(IS_PUBLIC_API, true) // Mark as public API
      }
    ).pipe(
      map(response => this.mapToUser(response))
    );
  }

  /**
   * Verify email with token
   * This is a PUBLIC API - no JWT token required
   */
  verifyEmail(token: string): Observable<void> {
    return this.post<void>(
      this.AUTH_ENDPOINTS.VERIFY_EMAIL,
      { token },
      {
        context: new HttpContext().set(IS_PUBLIC_API, true) // Mark as public API
      }
    );
  }

  /**
   * Request password reset
   * This is a PUBLIC API - no JWT token required
   */
  requestPasswordReset(email: string): Observable<void> {
    return this.post<void>(
      this.AUTH_ENDPOINTS.REQUEST_PASSWORD_RESET,
      { email },
      {
        context: new HttpContext().set(IS_PUBLIC_API, true) // Mark as public API
      }
    );
  }

  /**
   * Reset password with token
   * This is a PUBLIC API - no JWT token required
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.post<void>(
      this.AUTH_ENDPOINTS.RESET_PASSWORD,
      { token, newPassword },
      {
        context: new HttpContext().set(IS_PUBLIC_API, true) // Mark as public API
      }
    );
  }

  /**
   * Check username availability
   * This is a PUBLIC API - no JWT token required
   */
  checkUsernameAvailability(username: string): Observable<{ available: boolean }> {
    return this.get<{ available: boolean }>(
      `${this.AUTH_ENDPOINTS.CHECK_USERNAME}?nickName=${encodeURIComponent(username)}`,
      {
        context: new HttpContext().set(IS_PUBLIC_API, true)
      }
    );
  }

  /**
   * Check email availability
   * This is a PUBLIC API - no JWT token required
   */
  checkEmailAvailability(email: string): Observable<{ available: boolean }> {
    return this.get<{ available: boolean }>(
      `${this.AUTH_ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`,
      {
        context: new HttpContext().set(IS_PUBLIC_API, true)
      }
    );
  }

  /**
   * Map API response to AuthToken domain model
   */
  private mapToAuthToken(response: any): AuthToken {
    return new AuthToken(
      response.accessToken || response.access_token,
      response.refreshToken || response.refresh_token,
      response.expiresIn || response.expires_in,
      response.tokenType || response.token_type || 'Bearer'
    );
  }

  /**
   * Extract error message from API response
   */
  private extractErrorMessage(error: any): string {
    // Handle 422 business exceptions
    if (error.status === 422 && error.error?.msg) {
      return error.error.msg;
    }
    // Handle other error formats
    if (error.error?.message) {
      return error.error.message;
    }
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Map API response to User domain model
   */
  private mapToUser(response: any): User {
    return new User(
      response.id,
      response.email,
      response.username,
      response.nickName,
      response.firstName || response.first_name,
      response.lastName || response.last_name,
      response.roles,
      response.permissions
    );
  }
}
