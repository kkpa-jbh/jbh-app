import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu } from '@ionic/angular/standalone';
import { TranslationService } from './core/infrastructure/i18n/translation.service';
import { AppMenuComponent } from './shared/components/app-menu/app-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, IonMenu, AppMenuComponent],
})
export class AppComponent {
  constructor(private translationService: TranslationService) {
    // Initialize translation service (it will auto-detect/load saved language)
  }
}
