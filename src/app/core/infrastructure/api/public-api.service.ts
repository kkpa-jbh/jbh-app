import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EnvironmentConfig } from '../config/environment.config';
import { IS_PUBLIC_API } from '../interceptors/jwt.interceptor';
import { HttpOptions } from './api-base.service';

/**
 * Public API Service
 * Simplified service for making public API calls (no authentication required)
 * All requests made through this service are marked as public
 */
@Injectable({
  providedIn: 'root'
})
export class PublicApiService {

  constructor(
    private http: HttpClient,
    private envConfig: EnvironmentConfig
  ) {}

  /**
   * Performs a GET request to a public endpoint
   * @param endpoint - API endpoint path
   * @param options - HTTP options
   */
  get<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.get<T>(url, this.addPublicContext(options));
  }

  /**
   * Performs a POST request to a public endpoint
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param options - HTTP options
   */
  post<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.post<T>(url, body, this.addPublicContext(options));
  }

  /**
   * Performs a PUT request to a public endpoint
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param options - HTTP options
   */
  put<T>(endpoint: string, body: any, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.put<T>(url, body, this.addPublicContext(options));
  }

  /**
   * Performs a DELETE request to a public endpoint
   * @param endpoint - API endpoint path
   * @param options - HTTP options
   */
  delete<T>(endpoint: string, options?: HttpOptions): Observable<T> {
    const url = this.envConfig.buildApiUrl(endpoint);
    return this.http.delete<T>(url, this.addPublicContext(options));
  }

  /**
   * Add public API context to HTTP options
   */
  private addPublicContext(options?: HttpOptions): HttpOptions {
    const context = new HttpContext().set(IS_PUBLIC_API, true);

    if (!options) {
      return { context };
    }

    return {
      ...options,
      context
    };
  }
}
