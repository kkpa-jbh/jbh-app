import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-ios-install-modal',
  templateUrl: './ios-install-modal.component.html',
  styleUrls: ['./ios-install-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class IosInstallModalComponent {
  constructor(private modalController: ModalController) {}

  closeModal(): void {
    this.modalController.dismiss();
  }
}
