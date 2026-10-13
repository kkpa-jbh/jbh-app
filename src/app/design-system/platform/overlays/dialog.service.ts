import { Injectable, Type, inject } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  /** Defaults to the translated `common.cancel`. */
  cancelText?: string;
  /** Uses the destructive style for the confirm button. */
  destructive?: boolean;
}

export interface OpenDialogOptions {
  /** Opens as a bottom sheet that can be dragged between heights. */
  sheet?: boolean;
  /** Extra CSS class for the modal wrapper. */
  cssClass?: string;
}

const SHEET_BREAKPOINTS = [0, 0.5, 0.8, 1];
const SHEET_INITIAL_BREAKPOINT = 0.8;

/** Confirm dialogs and modals. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly alertController = inject(AlertController);
  private readonly modalController = inject(ModalController);
  private readonly translate = inject(TranslateService);

  /** Resolves `true` only when the user taps the confirm button. */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const alert = await this.alertController.create({
      header: options.title,
      message: options.message,
      buttons: [
        { text: options.cancelText ?? this.translate.instant('common.cancel'), role: 'cancel' },
        { text: options.confirmText, role: options.destructive ? 'destructive' : 'confirm' }
      ]
    });
    await alert.present();

    const { role } = await alert.onWillDismiss();
    return role === 'confirm' || role === 'destructive';
  }

  async open(component: Type<unknown>, options: OpenDialogOptions = {}): Promise<void> {
    const modal = await this.modalController.create({
      component,
      ...(options.cssClass ? { cssClass: options.cssClass } : {}),
      ...(options.sheet ? { breakpoints: SHEET_BREAKPOINTS, initialBreakpoint: SHEET_INITIAL_BREAKPOINT } : {})
    });
    await modal.present();
  }

  /** Closes the top modal. */
  async close(): Promise<void> {
    await this.modalController.dismiss();
  }
}
