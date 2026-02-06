import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, ViewWillEnter, ViewWillLeave } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.page.html',
  styleUrls: ['./transfer.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, TranslateModule, AppHeaderComponent]
})
export class TransferPage implements OnInit, ViewWillEnter, ViewWillLeave {

  constructor(private headerActions: HeaderActionsService) { }

  ngOnInit() {
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.transfer.formTitle'
    });
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

}
