import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { filter } from 'rxjs/operators';

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

  constructor(private platform: Platform) {}

  /**
   * Initialize service worker and set up automatic update checks
   * Call this in AppComponent
   */
  async initialize(): Promise<void> {
    // Only initialize for web (not native apps)
    if (this.platform.is('hybrid')) {
      console.log('[SW Update] Skipping - running as native app');
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW Update] Service Workers not supported');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW Update] Service Worker registered');

      // Set up listeners
      this.setupListeners();

      // Start automatic update checks
      this.startUpdateChecks();

    } catch (error) {
      console.error('[SW Update] Registration failed:', error);
    }
  }

  /**
   * Set up service worker event listeners
   */
  private setupListeners(): void {
    if (!this.registration) return;

    // Listen for updates
    this.registration.addEventListener('updatefound', () => {
      console.log('[SW Update] Update found, installing...');

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
            console.log('[SW Update] New version available');
            this.updateAvailableSubject.next({
              available: true,
              installing: false,
              message: 'New version available'
            });
          } else {
            // First install
            console.log('[SW Update] App ready for offline use');
          }
        }
      });
    });

    // Listen for controller change (update activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Update] New service worker activated, reloading...');
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
      console.warn('[SW Update] No service worker registered');
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW Update] Update check completed');
    } catch (error) {
      console.error('[SW Update] Update check failed:', error);
    }
  }

  /**
   * Apply the update (reload the page)
   * Call this when user confirms they want to update
   */
  applyUpdate(): void {
    if (!this.registration?.waiting) {
      console.warn('[SW Update] No update waiting');
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
