import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { filter } from 'rxjs/operators';
import { EnvironmentConfig } from '../config/environment.config';
import { LoggerService } from '../logging/logger.service';

export interface UpdateStatus {
  available: boolean;
  installing: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {
  private updateAvailableSubject = new BehaviorSubject<UpdateStatus>({
    available: false,
    installing: false,
    message: ''
  });
  public updateAvailable$: Observable<UpdateStatus> = this.updateAvailableSubject.asObservable();

  private registration: ServiceWorkerRegistration | null = null;
  private checkInterval = 60000; // Check every 60 seconds

  constructor(
    private platform: Platform,
    private envConfig: EnvironmentConfig,
    private logger: LoggerService
  ) {}

  /**
   * Initialize service worker and set up automatic update checks
   * Call this in AppComponent
   */
  async initialize(): Promise<void> {
    // Only initialize for web (not native apps)
    if (this.platform.is('hybrid')) {
      this.logger.info('Skipping - running as native app', 'SwUpdate');
      return;
    }

    // Skip in development mode
    if (!this.envConfig.isProduction) {
      this.logger.info('Skipping - development mode', 'SwUpdate');
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      this.logger.warn('Service Workers not supported', 'SwUpdate');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.logger.info('Service Worker registered', 'SwUpdate');

      // Set up listeners
      this.setupListeners();

      // Start automatic update checks
      this.startUpdateChecks();

    } catch (error) {
      this.logger.error('Registration failed:', 'SwUpdate', error);
    }
  }

  /**
   * Set up service worker event listeners
   */
  private setupListeners(): void {
    if (!this.registration) return;

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      this.logger.info('Update found, installing...', 'SwUpdate');

      const newWorker = this.registration?.installing;
      if (!newWorker) return;

      this.updateAvailableSubject.next({
        available: false,
        installing: true,
        message: 'Installing update...'
      });

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            this.logger.info('New version available', 'SwUpdate');
            this.updateAvailableSubject.next({
              available: true,
              installing: false,
              message: 'New version available'
            });
          } else {
            // First install
            this.logger.info('App ready for offline use', 'SwUpdate');
          }
        }
      });
    });

    // Listen for controller change (update activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.logger.info('New service worker activated, reloading...', 'SwUpdate');
      window.location.reload();
    });
  }

  /**
   * Start checking for updates periodically
   */
  private startUpdateChecks(): void {
    // Check for updates every 60 seconds
    interval(this.checkInterval)
      .pipe(filter(() => !this.platform.is('hybrid')))
      .subscribe(() => {
        this.checkForUpdate();
      });

    // Also check when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdate();
      }
    });

    // Check on page load
    window.addEventListener('load', () => {
      this.checkForUpdate();
    });
  }

  /**
   * Manually check for updates
   */
  async checkForUpdate(): Promise<void> {
    if (!this.registration) {
      this.logger.warn('No service worker registered', 'SwUpdate');
      return;
    }

    try {
      await this.registration.update();
      this.logger.debug('Update check completed', 'SwUpdate');
    } catch (error) {
      this.logger.error('Update check failed:', 'SwUpdate', error);
    }
  }

  /**
   * Apply the update (reload the page)
   * Call this when user confirms they want to update
   */
  applyUpdate(): void {
    if (!this.registration?.waiting) {
      this.logger.warn('No update waiting', 'SwUpdate');
      return;
    }

    // Tell the service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // The page will reload automatically via controllerchange event
  }

  /**
   * Check if an update is currently available
   */
  isUpdateAvailable(): boolean {
    return this.updateAvailableSubject.value.available;
  }
}
