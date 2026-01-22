import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PwaInstallService } from '@core/infrastructure/pwa/pwa-install.service';
import { IosInstallModalComponent } from '../ios-install-modal/ios-install-modal.component';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-install-app-button',
  templateUrl: './install-app-button.component.html',
  styleUrls: ['./install-app-button.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class InstallAppButtonComponent implements OnInit, OnDestroy {
  canInstall = false;
  isInstalled = false;
  private installableSubscription?: Subscription;

  constructor(
    private pwaInstallService: PwaInstallService,
    private modalController: ModalController,
    private toastController: ToastController,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.checkInstallStatus();

    // Subscribe to installable changes (for Android)
    this.installableSubscription = this.pwaInstallService.installable$.subscribe(
      (installable) => {
        this.canInstall = installable || this.pwaInstallService.isIOS();
        this.isInstalled = this.pwaInstallService.isAppInstalled();
      }
    );
  }

  ngOnDestroy(): void {
    this.installableSubscription?.unsubscribe();
  }

  private checkInstallStatus(): void {
    this.isInstalled = this.pwaInstallService.isAppInstalled();
    this.canInstall = this.pwaInstallService.canInstall();
  }

  async handleInstallClick(): Promise<void> {
    const installMethod = this.pwaInstallService.getInstallMethod();

    if (installMethod === 'ios-instructions') {
      await this.showIOSInstructions();
    } else if (installMethod === 'native-prompt') {
      await this.showNativePrompt();
    } else {
      await this.showNotAvailableMessage();
    }
  }

  private async showIOSInstructions(): Promise<void> {
    const modal = await this.modalController.create({
      component: IosInstallModalComponent,
      cssClass: 'ios-install-modal-wrapper',
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();
  }

  private async showNativePrompt(): Promise<void> {
    const result = await this.pwaInstallService.promptInstall();

    if (result === 'accepted') {
      await this.showSuccessToast();
    } else if (result === 'dismissed') {
      await this.showDismissedToast();
    } else {
      await this.showNotAvailableMessage();
    }
  }

  private async showSuccessToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.translationService.instant('pwa.installSuccess'),
      duration: 3000,
      color: 'success',
      icon: 'checkmark-circle-outline'
    });
    await toast.present();
  }

  private async showDismissedToast(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.translationService.instant('pwa.installDismissed'),
      duration: 2000,
      color: 'medium',
      icon: 'information-circle-outline'
    });
    await toast.present();
  }

  private async showNotAvailableMessage(): Promise<void> {
    const toast = await this.toastController.create({
      message: this.translationService.instant('pwa.installNotAvailable'),
      duration: 3000,
      color: 'warning',
      icon: 'alert-circle-outline'
    });
    await toast.present();
  }
}
