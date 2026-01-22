import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { TokenStorageService } from '../persistence/token-storage.service';

/**
 * HTTP Context Token to mark requests as public (no auth required)
 * Usage: httpClient.get(url, { context: new HttpContext().set(IS_PUBLIC_API, true) })
 */
export const IS_PUBLIC_API = new HttpContextToken<boolean>(() => false);

/**
 * JWT Interceptor
 * Automatically adds JWT token to outgoing HTTP requests
 * Skips token for requests marked as public using IS_PUBLIC_API context token
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private tokenStorage: TokenStorageService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Check if this is a public API (no auth required)
    const isPublicApi = request.context.get(IS_PUBLIC_API);

    // Always enable credentials to send cookies (RefreshToken, JWT)
    request = request.clone({
      withCredentials: true
    });

    if (isPublicApi) {
      // Don't add token for public APIs, but still send cookies
      return next.handle(request);
    }

    // For protected APIs, add JWT token
    return from(this.tokenStorage.getAccessToken()).pipe(
      switchMap(token => {
        if (token) {
          // Clone request and add Authorization header
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        }
        return next.handle(request);
      })
    );
  }
}
