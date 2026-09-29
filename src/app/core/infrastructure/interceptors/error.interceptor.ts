import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TokenStorageService } from '../persistence/token-storage.service';
import { TokenRefreshService } from '../auth/token-refresh.service';
import { IS_PUBLIC_API } from './jwt.interceptor';
import { LoggerService } from '../logging/logger.service';
import { TranslationService } from '../i18n/translation.service';
import { JBHError } from '@core/domain/models/jbh-error.model';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private _logger: LoggerService | null = null;
  private _translationService: TranslationService | null = null;
  private _tokenRefreshService: TokenRefreshService | null = null;

  constructor(
    private tokenStorage: TokenStorageService,
    private injector: Injector
  ) {}

  private get logger(): LoggerService {
    if (!this._logger) {
      this._logger = this.injector.get(LoggerService);
    }
    return this._logger;
  }

  private get translationService(): TranslationService {
    if (!this._translationService) {
      this._translationService = this.injector.get(TranslationService);
    }
    return this._translationService;
  }

  private get tokenRefreshService(): TokenRefreshService {
    if (!this._tokenRefreshService) {
      this._tokenRefreshService = this.injector.get(TokenRefreshService);
    }
    return this._tokenRefreshService;
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const isPublicApi = request.context.get(IS_PUBLIC_API);

        if (error.status === 422) {
          return this.handle422Error(error);
        }

        if (error.status === 401 && !isPublicApi) {
          return this.handle401Error(request, next, error);
        }

        if (error.status === 403 && !isPublicApi) {
          return this.handle403Error(error);
        }

        return throwError(() => new JBHError(
          error.message || 'An unexpected error occurred',
          error.status,
          error
        ));
      })
    );
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler, error: HttpErrorResponse): Observable<HttpEvent<unknown>> {
    const isTokenError = this.isTokenRelatedError(error);

    if (!isTokenError) {
      return throwError(() => new JBHError('Unauthorized', 401, error));
    }

    return this.tokenRefreshService.refreshToken().pipe(
      switchMap(success => {
        if (success) {
          return from(this.addTokenToRequest(request)).pipe(
            switchMap(req => next.handle(req))
          );
        }
        return from(this.tokenRefreshService.handleLogout()).pipe(
          switchMap(() => throwError(() => new JBHError('Session expired - please login again', 401, error)))
        );
      }),
      catchError(() => {
        return from(this.tokenRefreshService.handleLogout()).pipe(
          switchMap(() => throwError(() => new JBHError('Session expired - please login again', 401, error)))
        );
      })
    );
  }

  private isTokenRelatedError(error: HttpErrorResponse): boolean {
    const errorBody = error.error;

    if (errorBody && typeof errorBody === 'object') {
      const errorCode = errorBody.error_code || errorBody.errorCode;
      return errorCode === 'AUTH_TOKEN_EXPIRED' || errorCode === 'AUTH_MISSING_TOKEN';
    }

    return true;
  }

  private handle422Error(error: HttpErrorResponse): Observable<never> {
    const rawMessage = error.error?.msg || error.error?.message || 'Invalid request';
    const errorMessage = this.extractLocalizedMessage(rawMessage);

    this.logger.warn('Business exception (422):', 'ErrorInterceptor', errorMessage);

    return throwError(() => new JBHError(errorMessage, 422, error));
  }

  private extractLocalizedMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'Invalid request';
    }

    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object' && ('en' in parsed || 'es' in parsed)) {
        const currentLang = this.translationService.getCurrentLanguage();
        return parsed[currentLang] || parsed['en'] || parsed['es'] || message;
      }
    } catch {
      // Not a JSON string, return as-is
    }

    return message;
  }

  private handle403Error(error: HttpErrorResponse): Observable<never> {
    this.logger.error('Access forbidden:', 'ErrorInterceptor', error);
    return throwError(() => new JBHError(
      'Access forbidden - you do not have permission to access this resource',
      403,
      error
    ));
  }

  private async addTokenToRequest(request: HttpRequest<unknown>): Promise<HttpRequest<unknown>> {
    const token = await this.tokenStorage.getAccessToken();
    if (token) {
      return request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
    }
    return request;
  }
}
