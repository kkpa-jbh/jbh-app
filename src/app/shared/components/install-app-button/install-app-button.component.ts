import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { JbhNavItemComponent } from '@design-system/components';
import { DialogService, ToastService } from '@design-system/platform';
import { PwaInstallService } from '@core/infrastructure/pwa/pwa-install.service';
import { IosInstallModalComponent } from '../ios-install-modal/ios-install-modal.component';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-install-app-button',
  templateUrl: './install-app-button.component.html',
  styleUrls: ['./install-app-button.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, JbhNavItemComponent]
})
export class InstallAppButtonComponent implements OnInit, OnDestroy {
  canInstall = false;
  isInstalled = false;
  private destroy$ = new Subject<void>();

  constructor(
    private pwaInstallService: PwaInstallService,
    private dialog: DialogService,
    private toast: ToastService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.checkInstallStatus();

    // Subscribe to installable changes (for Android)
    this.pwaInstallService.installable$
      .pipe(takeUntil(this.destroy$))
      .subscribe((installable) => {
        this.canInstall = installable || this.pwaInstallService.isIOS();
        this.isInstalled = this.pwaInstallService.isAppInstalled();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    await this.dialog.open(IosInstallModalComponent, { sheet: true, cssClass: 'ios-install-modal-wrapper' });
  }

  private async showNativePrompt(): Promise<void> {
    const result = await this.pwaInstallService.promptInstall();

    if (result === 'accepted') {
      await this.toast.show(this.translationService.instant('pwa.installSuccess'), 'success');
    } else if (result === 'dismissed') {
      await this.toast.show(this.translationService.instant('pwa.installDismissed'), 'info');
    } else {
      await this.showNotAvailableMessage();
    }
  }

  private async showNotAvailableMessage(): Promise<void> {
    await this.toast.show(this.translationService.instant('pwa.installNotAvailable'), 'warning');
  }
}
