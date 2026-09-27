import { Injectable } from '@angular/core';
import { LoggerService } from '../logging/logger.service';

/**
 * Removes the old service worker and its caches from browsers that still have it.
 *
 * The app does not use a service worker any more: the old one served stale app versions and cached API data.
 * src/sw.js is a kill switch for browsers that do not run this code yet; this service cleans up right away
 * for browsers that already run the new app.
 */
@Injectable({
  providedIn: 'root'
})
export class ServiceWorkerCleanupService {
  constructor(private logger: LoggerService) {}

  async cleanUp(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if (registrations.length > 0) {
        this.logger.info(`Removed ${registrations.length} old service worker(s)`, 'ServiceWorkerCleanup');
      }
    } catch (error) {
      this.logger.warn('Service worker cleanup failed', 'ServiceWorkerCleanup', error);
    }
  }
}
