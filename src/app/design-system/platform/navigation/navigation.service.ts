import { Injectable, inject } from '@angular/core';
import { MenuController } from '@ionic/angular/standalone';

/** Side menu control. Navigation between routes stays with the Angular `Router`. */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly menuController = inject(MenuController);

  /** Resolves when the menu is closed. */
  async closeMenu(): Promise<void> {
    await this.menuController.close();
  }
}
