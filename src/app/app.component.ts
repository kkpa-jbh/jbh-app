import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, ToastController } from '@ionic/angular/standalone';
import { TranslationService } from './core/infrastructure/i18n/translation.service';
import { PushNotificationService } from './core/infrastructure/push/push-notification.service';
import { SwUpdateService } from './core/infrastructure/pwa/sw-update.service';
import { AppMenuComponent } from './shared/components/app-menu/app-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonMenu, AppMenuComponent],
})
export class AppComponent implements OnInit {
  constructor(
    private translationService: TranslationService,
    private pushNotificationService: PushNotificationService,
    private swUpdateService: SwUpdateService,
    private toastController: ToastController
  ) {
    // Initialize translation service (it will auto-detect/load saved language)
  }

  async ngOnInit(): Promise<void> {
    // Initialize push notifications (native apps only)
    await this.pushNotificationService.initialize();

    // Subscribe to FCM token changes
    this.pushNotificationService.fcmToken$.subscribe(token => {
      if (token) {
        console.log('FCM Token ready to send to backend:', token);
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
}
