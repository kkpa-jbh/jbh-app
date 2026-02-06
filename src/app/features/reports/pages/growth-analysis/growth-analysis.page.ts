import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-growth-analysis',
  templateUrl: './growth-analysis.page.html',
  styleUrls: ['./growth-analysis.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, AppHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrowthAnalysisPage implements ViewWillEnter, ViewWillLeave {

  constructor(private headerActions: HeaderActionsService) {}

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'reports.growthAnalysis.formTitle',
      showBackButton: true
    });
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }
}
