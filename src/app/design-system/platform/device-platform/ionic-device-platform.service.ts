import { Injectable, inject } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { DevicePlatform } from '@core/infrastructure/platform/device-platform';

/** Answers the device questions with Ionic `Platform`. Bound to `DevicePlatform` in `main.ts`. */
@Injectable({ providedIn: 'root' })
export class IonicDevicePlatform extends DevicePlatform {
  private readonly platform = inject(Platform);

  isNativeApp(): boolean {
    return this.platform.is('hybrid');
  }

  isIos(): boolean {
    return this.platform.is('ios');
  }

  isAndroid(): boolean {
    return this.platform.is('android');
  }
}
