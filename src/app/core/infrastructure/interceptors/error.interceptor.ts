import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from, of, firstValueFrom } from 'rxjs';
import { catchError, filter, take, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { TokenStorageService } from '../persistence/token-storage.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { IS_PUBLIC_API } from './jwt.interceptor';
import { LoggerService } from '../logging/logger.service';

/**
 * Error Interceptor
 * Handles HTTP errors globally, especially 401 (Unauthorized) and 403 (Forbidden)
 * Implements token refresh logic for 401 errors
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private _logger: LoggerService | null = null;

  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router,
    private platform: Platform,
    private authRepository: AuthRepository,
    private injector: Injector
  ) {}

  private get logger(): LoggerService {
    if (!this._logger) {
      this._logger = this.injector.get(LoggerService);
    }
    return this._logger;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // Check if this is a public API - don't handle auth errors
        const isPublicApi = request.context.get(IS_PUBLIC_API);

        // Handle 422 business exceptions - return friendly error message
        if (error.status === 422) {
          return this.handle422Error(error);
        }

        if (error.status === 401 && !isPublicApi) {
          return this.handle401Error(request, next, error);
        }

        if (error.status === 403 && !isPublicApi) {
          return this.handle403Error(error);
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Handle 401 Unauthorized errors
   * Checks if token is expired and attempts to refresh it
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler, error: HttpErrorResponse): Observable<HttpEvent<any>> {

    // Check if this is specifically a token expiration error
    // Gateway responds with: {"error_code": "AUTH_TOKEN_EXPIRED", "message": "...", "timestamp": ...}
    const isTokenExpired = this.isTokenExpiredError(error);

    if (!isTokenExpired) {
      // Not a token expiration, just a regular 401 (invalid credentials, etc.)
      return throwError(() => new Error('Unauthorized'));
    }

    // If we're already refreshing, wait for the new token
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => from(this.addTokenToRequest(request))),
        switchMap(req => next.handle(req))
      );
    }

    // Start token refresh process
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return from(this.refreshAccessToken()).pipe(
      switchMap(success => {
        if (success) {
          // Token refreshed successfully, notify waiting requests
          this.isRefreshing = false;
          this.refreshTokenSubject.next(true);

          // Retry the original request with new token
          return from(this.addTokenToRequest(request)).pipe(
            switchMap(req => next.handle(req))
          );
        } else {
          // Refresh failed, logout user
          return from(this.handleLogout()).pipe(
            switchMap(() => throwError(() => new Error('Session expired - please login again')))
          );
        }
      }),
      catchError(err => {
        // Refresh failed, logout user
        this.isRefreshing = false;
        return from(this.handleLogout()).pipe(
          switchMap(() => throwError(() => new Error('Session expired - please login again')))
        );
      })
    );
  }

  /**
   * Check if the error is specifically a token expiration error
   * Gateway responds with: {"error_code": "AUTH_TOKEN_EXPIRED", "message": "...", "timestamp": ...}
   */
  private isTokenExpiredError(error: HttpErrorResponse): boolean {
    // Check if error response body contains error_code === "AUTH_TOKEN_EXPIRED"
    const errorBody = error.error;

    if (errorBody && typeof errorBody === 'object') {
      return errorBody.error_code === 'AUTH_TOKEN_EXPIRED';
    }

    // If we can't determine from error body, assume it's a token expiration
    // (better to attempt refresh than to immediately logout)
    return true;
  }

  /**
   * Refresh the access token
   * Uses different strategies for web (cookies) vs mobile (storage)
   *
   * Web (PWA/Browser):
   * - Refresh token is stored in HTTP-only cookie (secure, can't be accessed by JS)
   * - Don't extract or send refresh token manually
   * - Backend reads it automatically from cookie (withCredentials: true)
   *
   * Mobile (iOS/Android via Capacitor):
   * - Both tokens stored in secure storage (Keychain/Keystore)
   * - Refresh token sent explicitly in request body
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const isMobile = this.platform.is('capacitor'); // Capacitor = native mobile app
      const isWeb = !isMobile;

      let refreshToken: string | undefined = undefined;

      if (isMobile) {
        // Mobile: Get refresh token from secure storage (Keychain/Keystore)
        // and send it explicitly in the request body
        const storedRefreshToken = await this.tokenStorage.getRefreshToken();

        if (!storedRefreshToken) {
          this.logger.error('No refresh token found in secure storage', 'ErrorInterceptor');
          return false;
        }

        refreshToken = storedRefreshToken;
        this.logger.debug('Using refresh token from secure storage', 'ErrorInterceptor');
      } else {
        // Web/PWA: Refresh token comes from HTTP-only cookie automatically
        // DO NOT extract or send manually - the cookie is sent via withCredentials: true
        this.logger.debug('Using refresh token from HTTP-only cookie', 'ErrorInterceptor');
      }

      // Call refresh token endpoint
      // Mobile: sends refreshToken in body (from secure storage)
      // Web: refreshToken comes from HTTP-only cookie (withCredentials: true)
      const newToken = await firstValueFrom(this.authRepository.refreshToken(refreshToken));

      if (newToken) {
        // Save new tokens
        if (isMobile) {
          // Mobile: Save both tokens to secure storage
          await this.tokenStorage.saveToken(newToken);
          this.logger.debug('New tokens saved to secure storage', 'ErrorInterceptor');
        } else {
          // Web: Only save access token to storage (refresh token stays in HTTP-only cookie)
          // The backend will update the refresh token cookie automatically
          await this.tokenStorage.saveToken(newToken);
          this.logger.debug('New access token saved (refresh token remains in cookie)', 'ErrorInterceptor');
        }

        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to refresh token:', 'ErrorInterceptor', error);
      return false;
    }
  }

  /**
   * Handle 422 Unprocessable Entity (Business Exceptions)
   * Return user-friendly error message from API response
   */
  private handle422Error(error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error?.msg || error.error?.message || 'Invalid request';

    if (this.tokenStorage) {
      // Log for debugging (only in non-production)
      this.logger.warn('Business exception (422):', 'ErrorInterceptor', errorMessage);
    }

    // Create a user-friendly error with the message from API
    const businessError = new Error(errorMessage);
    (businessError as any).status = 422;
    (businessError as any).originalError = error;

    return throwError(() => businessError);
  }

  /**
   * Handle 403 Forbidden errors
   * User doesn't have permission to access the resource
   */
  private handle403Error(error: HttpErrorResponse): Observable<never> {
    this.logger.error('Access forbidden:', 'ErrorInterceptor', error);

    // Optionally navigate to an access denied page
    // this.router.navigate(['/access-denied']);

    return throwError(() => new Error('Access forbidden - you do not have permission to access this resource'));
  }

  /**
   * Add token to request
   */
  private async addTokenToRequest(request: HttpRequest<any>): Promise<HttpRequest<any>> {
    const token = await this.tokenStorage.getAccessToken();
    if (token) {
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true  // Ensure credentials are sent with retry
      });
    }
    return request;
  }

  /**
   * Handle logout - clear tokens and redirect to login
   */
  private async handleLogout(): Promise<void> {
    this.isRefreshing = false;
    await this.tokenStorage.clearTokens();
    this.router.navigate(['/login']);
  }
}
