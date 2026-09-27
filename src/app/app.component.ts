import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonContent } from '@ionic/angular/standalone';
import { EMPTY, catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs';
import { TranslationService } from './core/infrastructure/i18n/translation.service';
import { PushNotificationService } from './core/infrastructure/push/push-notification.service';
import { ServiceWorkerCleanupService } from './core/infrastructure/pwa/service-worker-cleanup.service';
import { LoggerService } from './core/infrastructure/logging/logger.service';
import { AppMenuComponent } from './shared/components/app-menu/app-menu.component';
import { AuthUseCase } from './core/domain/use-cases/auth.use-case';
import { PreferencesUseCase } from './core/domain/use-cases/preferences.use-case';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonMenu, IonContent, AppMenuComponent],
})
export class AppComponent implements OnInit {
  constructor(
    private translationService: TranslationService,
    private pushNotificationService: PushNotificationService,
    private serviceWorkerCleanup: ServiceWorkerCleanupService,
    private logger: LoggerService,
    private authUseCase: AuthUseCase,
    private preferencesUseCase: PreferencesUseCase
  ) {
    // Initialize translation service (it will auto-detect/load saved language)
  }

  async ngOnInit(): Promise<void> {
    this.applyUserLanguage();

    // No service worker any more: remove the old one, which served stale app versions and cached API data.
    await this.serviceWorkerCleanup.cleanUp();

    // Initialize push notifications (native apps only)
    await this.pushNotificationService.initialize();

    // Subscribe to FCM token changes
    this.pushNotificationService.fcmToken$.subscribe(token => {
      if (token) {
        this.logger.debug('FCM Token ready to send to backend:', 'AppComponent', token);
        // Send token to your Java microservice
        this.pushNotificationService.sendTokenToBackend(token);
      }
    });
  }

  // The user's language is saved in their preferences on the backend, so it follows them to every device.
  // Apply it whenever a user becomes known: at startup with a stored token, and after each login.
  private applyUserLanguage(): void {
    this.authUseCase.currentUser$
      .pipe(
        // Logout emits null, so logging in again as the same user still reloads the preferences.
        map(user => user?.id ?? null),
        distinctUntilChanged(),
        filter(userId => userId !== null),
        // No preferences yet (new user) or a failed call: keep the language picked at startup.
        switchMap(() => this.preferencesUseCase.getPreferences().pipe(catchError(() => EMPTY)))
      )
      .subscribe(preferences => this.translationService.setLanguage(preferences.defaultLang.toLowerCase()));
  }
}
