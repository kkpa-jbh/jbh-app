import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { TokenStorageService } from '../persistence/token-storage.service';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { LoggerService } from '../logging/logger.service';
import { environment } from 'src/environments/environment';

export const IS_PUBLIC_API = new HttpContextToken<boolean>(() => false);

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  private logger = inject(LoggerService);
  private tokenRefreshService = inject(TokenRefreshService);

  constructor(private tokenStorage: TokenStorageService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isPublicApi = request.context.get(IS_PUBLIC_API);

    if (!this.isApiRequest(request.url)) {
      return next.handle(request);
    }

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
        }
        return next.handle(request);
      })
    );
  }

  private isApiRequest(url: string): boolean {
    const apiBaseUrl = environment.api.baseUrl;
    return url.startsWith(apiBaseUrl) || url.includes(apiBaseUrl);
  }
}
