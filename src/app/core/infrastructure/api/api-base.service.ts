import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { LoggerService } from '../logging/logger.service';

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  observe?: 'body';
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  context?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiBaseService {

  constructor(
    private http: HttpClient,
    private envConfig: EnvironmentConfig,
    private logger: LoggerService
  ) {
    // Log environment info on service initialization
    this.envConfig.logEnvironmentInfo();
  }

  /**
   * Performs a GET request
   * @param endpoint - API endpoint path
   * @param options - HTTP options
   */
  protected get<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.get<T>(url, options).pipe(
      timeout(this.envConfig.apiTimeout),
      retry(this.envConfig.apiRetryAttempts),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Performs a POST request
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param options - HTTP options
   */
  protected post<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.post<T>(url, body, options).pipe(
      timeout(this.envConfig.apiTimeout),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Performs a PUT request
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param options - HTTP options
   */
  protected put<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.put<T>(url, body, options).pipe(
      timeout(this.envConfig.apiTimeout),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Performs a PATCH request
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param options - HTTP options
   */
  protected patch<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.patch<T>(url, body, options).pipe(
      timeout(this.envConfig.apiTimeout),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Performs a DELETE request
   * @param endpoint - API endpoint path
   * @param options - HTTP options
   */
  protected delete<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.delete<T>(url, options).pipe(
      timeout(this.envConfig.apiTimeout),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   */
  private handleError(error: HttpErrorResponse | TimeoutError | Error): Observable<never> {
    // Check if error was already processed by ErrorInterceptor (e.g., 422 business errors)
    if (error instanceof Error && (error as any).status === 422) {
      return throwError(() => error);
    }

    let errorMessage = 'An unknown error occurred';

    if (error instanceof TimeoutError) {
      errorMessage = 'Request timeout - please try again';
      this.logger.error('API Timeout Error:', 'ApiBase', errorMessage);
    } else if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Client Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = `Server Error: ${error.status} - ${error.message}`;

        // You can customize error messages based on status codes
        switch (error.status) {
          case 0:
            errorMessage = 'No connection to server. Please check your internet connection.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 401:
            errorMessage = 'Unauthorized - please login again';
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
            case 422:
            errorMessage = error.message;
            break;
          case 500:
            errorMessage = 'Internal server error';
            break;
          case 503:
            errorMessage = 'Service unavailable';
            break;
        }
      }

      this.logger.error('API Error:', 'ApiBase', {
          status: error.status,
          message: errorMessage,
          error: error.error,
          url: error.url
        });
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get the base URL for the API
   */
  protected getBaseUrl(): string {
    return this.envConfig.apiBaseUrl;
  }

  /**
   * Build a full API URL
   * @param endpoint - API endpoint path
   */
  protected buildUrl(endpoint: string): string {
    return this.envConfig.buildApiUrl(endpoint);
  }
}
