import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenStorageService } from '../persistence/token-storage.service';
import { IS_PUBLIC_API } from './jwt.interceptor';

/**
 * Error Interceptor
 * Handles HTTP errors globally, especially 401 (Unauthorized) and 403 (Forbidden)
 * Implements token refresh logic for 401 errors
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

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
          return this.handle401Error(request, next);
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
   * Attempts to refresh the token and retry the request
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

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

    return new Observable(observer => {
      this.tokenStorage.getRefreshToken().then(refreshToken => {
        if (refreshToken) {
          // TODO: Call your refresh token API endpoint here
          // For now, we'll just clear tokens and redirect to login
          this.handleLogout();
          observer.error('Session expired');
        } else {
          this.handleLogout();
          observer.error('No refresh token available');
        }
      });
    });
  }

  /**
   * Handle 422 Unprocessable Entity (Business Exceptions)
   * Return user-friendly error message from API response
   */
  private handle422Error(error: HttpErrorResponse): Observable<never> {
    const errorMessage = error.error?.msg || error.error?.message || 'Invalid request';

    if (this.tokenStorage) {
      // Log for debugging (only in non-production)
      console.warn('Business exception (422):', errorMessage);
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
    console.error('Access forbidden:', error);

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
        }
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
