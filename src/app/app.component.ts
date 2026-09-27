import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, ToastController } from '@ionic/angular/standalone';
import { EMPTY, catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs';
import { TranslationService } from './core/infrastructure/i18n/translation.service';
import { PushNotificationService } from './core/infrastructure/push/push-notification.service';
import { SwUpdateService } from './core/infrastructure/pwa/sw-update.service';
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
    private swUpdateService: SwUpdateService,
    private toastController: ToastController,
    private logger: LoggerService,
    private authUseCase: AuthUseCase,
    private preferencesUseCase: PreferencesUseCase
  ) {
    // Initialize translation service (it will auto-detect/load saved language)
  }

  async ngOnInit(): Promise<void> {
    this.applyUserLanguage();

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

    // Initialize service worker for PWA auto-updates (web only)
    await this.swUpdateService.initialize();

    // Subscribe to update notifications
    this.swUpdateService.updateAvailable$.subscribe(async (status) => {
      if (status.available) {
        // Show toast notification for available update
        const toast = await this.toastController.create({
          message: this.translationService.instant('pwa.updateAvailable'),
          duration: 0, // Don't auto-dismiss
          position: 'bottom',
          color: 'primary',
          buttons: [
            {
              text: this.translationService.instant('pwa.updateNow'),
              role: 'confirm',
              handler: () => {
                this.swUpdateService.applyUpdate();
              }
            },
            {
              text: this.translationService.instant('common.cancel'),
              role: 'cancel'
            }
          ]
        });
        await toast.present();
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
