import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { registerJbhIcons } from '../../components/icon/icon-registry';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

const TOAST_COLORS: Record<ToastTone, string> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'medium'
};

const TOAST_DURATION_MS = 3000;

/** Shows a short message at the bottom of the screen, with a close button. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastController = inject(ToastController);

  async show(message: string, tone: ToastTone = 'info'): Promise<void> {
    // The close button names its icon by string, so the icon must be registered before it shows.
    registerJbhIcons();

    const toast = await this.toastController.create({
      message,
      duration: TOAST_DURATION_MS,
      position: 'bottom',
      color: TOAST_COLORS[tone],
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
