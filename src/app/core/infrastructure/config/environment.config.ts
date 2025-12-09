import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export interface FeatureConfig {
  enableLogging: boolean;
  enableDebugMode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentConfig {

  private readonly env = environment;

  get isProduction(): boolean {
    return this.env.production;
  }

  get environmentName(): string {
    return this.env.environmentName;
  }

  get apiConfig(): ApiConfig {
    return this.env.api;
  }

  get apiBaseUrl(): string {
    return this.env.api.baseUrl;
  }

  get apiTimeout(): number {
    return this.env.api.timeout;
  }

  get apiRetryAttempts(): number {
    return this.env.api.retryAttempts;
  }

  get features(): FeatureConfig {
    return this.env.features;
  }

  get isLoggingEnabled(): boolean {
    return this.env.features.enableLogging;
  }

  get isDebugModeEnabled(): boolean {
    return this.env.features.enableDebugMode;
  }

  /**
   * Build a complete API endpoint URL
   * @param endpoint - The API endpoint path (e.g., '/users', '/products')
   * @returns Complete URL
   */
  buildApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.apiBaseUrl}${cleanEndpoint}`;
  }

  /**
   * Log environment information (useful for debugging)
   */
  logEnvironmentInfo(): void {
    if (this.isLoggingEnabled) {
      console.log('=== Environment Configuration ===');
      console.log('Environment:', this.environmentName);
      console.log('Production:', this.isProduction);
      console.log('API Base URL:', this.apiBaseUrl);
      console.log('Debug Mode:', this.isDebugModeEnabled);
      console.log('================================');
    }
  }
}
