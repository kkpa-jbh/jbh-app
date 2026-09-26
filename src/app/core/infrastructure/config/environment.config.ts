import { Injectable, Injector } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../logging/logger.service';

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
  private _logger: LoggerService | null = null;

  constructor(private injector: Injector) {}

  private get logger(): LoggerService {
    if (!this._logger) {
      this._logger = this.injector.get(LoggerService);
    }
    return this._logger;
  }

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

  get googleClientId(): string {
    return this.env.google.clientId;
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

  get appVersion(): string {
    return this.env.appVersion;
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
    this.logger.info('=== Environment Configuration ===', 'EnvConfig');
    this.logger.info(`Environment: ${this.environmentName}`, 'EnvConfig');
    this.logger.info(`Production: ${this.isProduction}`, 'EnvConfig');
    this.logger.info(`API Base URL: ${this.apiBaseUrl}`, 'EnvConfig');
    this.logger.info(`Debug Mode: ${this.isDebugModeEnabled}`, 'EnvConfig');
    this.logger.info('================================', 'EnvConfig');
  }
}
