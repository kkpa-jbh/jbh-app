import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { JbhButtonComponent, JbhIconButtonComponent, JbhIconComponent } from '@design-system/components';
import { DialogService } from '@design-system/platform';

@Component({
  selector: 'app-ios-install-modal',
  templateUrl: './ios-install-modal.component.html',
  styleUrls: ['./ios-install-modal.component.scss'],
  standalone: true,
  imports: [TranslateModule, JbhButtonComponent, JbhIconButtonComponent, JbhIconComponent]
})
export class IosInstallModalComponent {
  constructor(private dialog: DialogService) {}

  closeModal(): void {
    this.dialog.close();
  }
}
