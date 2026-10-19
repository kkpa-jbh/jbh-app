import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { BalanceHistoryUseCase } from '@core/domain/use-cases/balance-history.use-case';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { BalanceHistoryEntryModel, BalanceHistorySummaryModel } from '@core/domain/features/balance-history';
import { ProductListItem } from '@core/domain/features/products';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { BalanceHistoryFilterComponent, BalanceFilterEvent } from '../../components/balance-history-filter/balance-history-filter.component';
import { BalanceSummaryCardsComponent } from '../../components/balance-summary-cards/balance-summary-cards.component';
import { BalanceChartComponent } from '../../components/balance-chart/balance-chart.component';
import { BalanceHistoryTableComponent } from '../../components/balance-history-table/balance-history-table.component';
import { JbhEmptyStateComponent, JbhPageHeaderComponent, JbhSkeletonComponent } from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-balance-history',
  templateUrl: './balance-history.page.html',
  styleUrls: ['./balance-history.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    BalanceHistoryFilterComponent,
    BalanceSummaryCardsComponent,
    BalanceChartComponent,
    BalanceHistoryTableComponent,
    JbhEmptyStateComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSkeletonComponent,
    AppHeaderComponent
  ]
})
export class BalanceHistoryPage implements OnInit, OnDestroy {
  products: ProductListItem[] = [];
  balances: BalanceHistoryEntryModel[] = [];
  summary: BalanceHistorySummaryModel | null = null;
  isLoading = true;
  isProductsLoading = true;
  hasData = false;
  initialProductId: string | null = null;
  showProductColumn = false;

  private destroy$ = new Subject<void>();
  currentFilter: BalanceFilterEvent | null = null;

  private readonly balanceHistoryUseCase = inject(BalanceHistoryUseCase);
  private readonly productUseCase = inject(ProductUseCase);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly translationService = inject(TranslationService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.initialProductId = params['productId'] || null;
        this.cdr.markForCheck();
      });
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.balanceHistory.formTitle'
    });
    this.loadProducts();
    if (this.currentFilter) {
      this.loadBalances(this.currentFilter);
    }
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts(): void {
    this.isProductsLoading = true;
    this.cdr.markForCheck();
    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isProductsLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading products', 'BalanceHistoryPage', error);
          this.isProductsLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onFilterApplied(event: BalanceFilterEvent): void {
    this.currentFilter = event;
    this.loadBalances(event);
  }

  private loadBalances(filter: BalanceFilterEvent): void {
    this.isLoading = true;
    this.hasData = false;
    this.showProductColumn = !filter.productId;
    this.cdr.markForCheck();

    const observable = filter.productId
      ? this.balanceHistoryUseCase.refreshProductBalances(filter.productId, filter.request)
      : this.balanceHistoryUseCase.refreshAllBalances(filter.request);

    observable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.balances = result.balances;
          this.summary = result.summary;
          this.hasData = result.balances.length > 0;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: JBHError) => {
          this.logger.error('Error loading balance history', 'BalanceHistoryPage', error);
          this.isLoading = false;
          this.hasData = false;
          this.cdr.markForCheck();
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.balanceHistory.errors.load');
          this.toast.show(errorMessage, 'error');
        }
      });
  }
}
