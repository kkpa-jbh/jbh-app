import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
import { Observable, from, switchMap, throwError } from 'rxjs';
import { TokenStorageService } from '../persistence/token-storage.service';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { LoggerService } from '../logging/logger.service';

export const IS_PUBLIC_API = new HttpContextToken<boolean>(() => false);

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private logger = inject(LoggerService);
  private tokenRefreshService = inject(TokenRefreshService);

  constructor(private tokenStorage: TokenStorageService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isPublicApi = request.context.get(IS_PUBLIC_API);

    request = request.clone({ withCredentials: true });

    if (isPublicApi) {
      return next.handle(request);
    }

    return this.tokenRefreshService.waitForRefresh().pipe(
      switchMap(() => from(this.tokenStorage.getAccessToken())),
      switchMap(token => {
        if (token) {
          this.logger.debug('Token retrieved', 'JwtInterceptor', {
            hasToken: true,
            tokenLength: token.length,
            url: request.url
          });
          request = request.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(request);
        }

        this.logger.warn('No access token - attempting proactive refresh', 'JwtInterceptor', request.url);
        return this.attemptProactiveRefresh(request, next);
      })
    );
  }

  private attemptProactiveRefresh(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return this.tokenRefreshService.refreshToken().pipe(
      switchMap(success => {
        if (success) {
          return from(this.tokenStorage.getAccessToken()).pipe(
            switchMap(newToken => {
              if (newToken) {
                this.logger.debug('Proactive refresh successful, retrying request', 'JwtInterceptor', request.url);
                request = request.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
              }
              return next.handle(request);
            })
          );
        }
        return from(this.tokenRefreshService.handleLogout()).pipe(
          switchMap(() => throwError(() => new Error('Session expired - please login again')))
        );
      })
    );
  }
}
