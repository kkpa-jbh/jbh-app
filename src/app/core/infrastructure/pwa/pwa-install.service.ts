import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../logging/logger.service';

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: InstallPromptEvent | null = null;
  private installableSubject = new BehaviorSubject<boolean>(false);
  public installable$: Observable<boolean> = this.installableSubject.asObservable();

  constructor(
    private platform: Platform,
    private logger: LoggerService
  ) {
    this.initInstallPrompt();
  }

  /**
   * Initialize the beforeinstallprompt event listener
   * Only works on Android/Chrome, not iOS Safari
   */
  private initInstallPrompt(): void {
    if (!this.platform.is('hybrid')) {
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        this.deferredPrompt = e as InstallPromptEvent;
        this.installableSubject.next(true);
        this.logger.info('beforeinstallprompt event captured', 'PwaInstall');
      });

      // Listen for successful install
      window.addEventListener('appinstalled', () => {
        this.logger.info('App installed successfully', 'PwaInstall');
        this.deferredPrompt = null;
        this.installableSubject.next(false);
      });
    }
  }

  /**
   * Detect if running on iOS Safari
   */
  isIOS(): boolean {
    return this.platform.is('ios') && !this.platform.is('hybrid');
  }

  /**
   * Detect if running on Android Chrome (or other browser supporting PWA)
   */
  isAndroid(): boolean {
    return this.platform.is('android') && !this.platform.is('hybrid');
  }

  /**
   * Check if app is already installed (running in standalone mode)
   */
  isAppInstalled(): boolean {
    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // iOS specific check
    const isIOSStandalone = (window.navigator as any).standalone === true;

    return isStandalone || isIOSStandalone;
  }

  /**
   * Check if browser supports PWA install
   */
  canInstall(): boolean {
    // If already installed, can't install again
    if (this.isAppInstalled()) {
      return false;
    }

    // iOS Safari - always show instructions
    if (this.isIOS()) {
      return true;
    }

    // Android/Chrome - check if beforeinstallprompt was fired
    return this.deferredPrompt !== null;
  }

  /**
   * Trigger the native install prompt (Android/Chrome only)
   * For iOS, this should show a modal with instructions instead
   */
  async promptInstall(): Promise<'accepted' | 'dismissed' | 'not-available'> {
    if (!this.deferredPrompt) {
      this.logger.debug('No install prompt available', 'PwaInstall');
      return 'not-available';
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      this.logger.info(`User ${outcome} the install prompt`, 'PwaInstall');

      if (outcome === 'accepted') {
        this.deferredPrompt = null;
        this.installableSubject.next(false);
      }

      return outcome;
    } catch (error) {
      this.logger.error('Error showing install prompt', 'PwaInstall', error);
      return 'dismissed';
    }
  }

  /**
   * Get the platform-specific install method
   */
  getInstallMethod(): 'native-prompt' | 'ios-instructions' | 'not-supported' {
    if (this.isAppInstalled()) {
      return 'not-supported';
    }

    if (this.isIOS()) {
      return 'ios-instructions';
    }

    if (this.deferredPrompt) {
      return 'native-prompt';
    }

    return 'not-supported';
  }
}
