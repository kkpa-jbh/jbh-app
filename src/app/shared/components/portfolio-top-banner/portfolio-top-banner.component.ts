import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';

@Component({
  selector: 'app-portfolio-top-banner',
  templateUrl: './portfolio-top-banner.component.html',
  styleUrls: ['./portfolio-top-banner.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioTopBannerComponent {
  currentContext$ = this.portfolioContext.context$;

  constructor(private portfolioContext: PortfolioContextService) {}
}
