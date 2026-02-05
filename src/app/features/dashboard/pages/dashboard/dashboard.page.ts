import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { JbhCurrencyPipe } from '@shared/pipes/jbh-currency.pipe';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule, JbhCurrencyPipe, AppHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  currentContext$ = this.portfolioContext.context$;
  totalBalance = 0;
  activeProductsCount = 0;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private portfolioContext: PortfolioContextService,
    private productUseCase: ProductUseCase,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService,
    private headerActions: HeaderActionsService
  ) {}

  ngOnInit(): void {}

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'menu.dashboard'
    });
    this.loadDashboardData();
  }

  ionViewWillLeave(): void {
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
