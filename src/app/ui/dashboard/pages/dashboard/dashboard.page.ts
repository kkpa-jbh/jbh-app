import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { JbhCurrencyPipe } from '@shared/pipes/jbh-currency.pipe';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { JbhButtonComponent, JbhCardComponent } from '@design-system/components';
import { JbhPageComponent } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
    RouterLink,
    JbhButtonComponent,
    JbhCardComponent,
    JbhPageComponent,
    JbhCurrencyPipe,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnDestroy {
  private readonly portfolioContext = inject(PortfolioContextService);
  private readonly productUseCase = inject(ProductUseCase);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);

  currentContext$ = this.portfolioContext.context$;
  totalBalance = 0;
  activeProductsCount = 0;
  isLoading = false;
  private destroy$ = new Subject<void>();

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'menu.dashboard'
    });
    this.loadDashboardData();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    combineLatest([
      this.productUseCase.getProducts(),
      this.currentContext$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([products, context]) => {
          this.activeProductsCount = products.filter(p => p.isActive).length;
          this.totalBalance = products.reduce((sum, p) => sum + (p.currentBalance || 0), 0);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading dashboard data', 'Dashboard', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
