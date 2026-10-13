import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { JbhCardComponent, JbhIconComponent } from '@design-system/components';
import { JbhPageComponent } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-growth-analysis',
  templateUrl: './growth-analysis.page.html',
  styleUrls: ['./growth-analysis.page.scss'],
  standalone: true,
  imports: [TranslateModule, JbhCardComponent, JbhIconComponent, JbhPageComponent, AppHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrowthAnalysisPage {
  private readonly headerActions = inject(HeaderActionsService);

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'menu.reports.growthAnalysis'
    });
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }
}
