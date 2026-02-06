import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ViewWillEnter, ViewWillLeave, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import { analyticsOutline, refreshOutline, walletOutline } from 'ionicons/icons';
import { BalanceHistoryUseCase } from '@core/domain/use-cases/balance-history.use-case';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { BalanceHistoryEntryModel, MonthlyBalanceRequest, BalanceHistorySummaryModel } from '@core/domain/models/balance-history.model';
import { ProductListItem } from '@core/domain/models/product-list-item.model';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { BalanceHistoryFilterComponent, BalanceFilterEvent } from '../../components/balance-history-filter/balance-history-filter.component';
import { BalanceSummaryCardsComponent } from '../../components/balance-summary-cards/balance-summary-cards.component';
import { BalanceChartComponent } from '../../components/balance-chart/balance-chart.component';
import { BalanceHistoryTableComponent } from '../../components/balance-history-table/balance-history-table.component';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-balance-history',
  templateUrl: './balance-history.page.html',
  styleUrls: ['./balance-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    BalanceHistoryFilterComponent,
    BalanceSummaryCardsComponent,
    BalanceChartComponent,
    BalanceHistoryTableComponent,
    AppHeaderComponent
  ]
})
export class BalanceHistoryPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
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

  constructor(
    private balanceHistoryUseCase: BalanceHistoryUseCase,
    private productUseCase: ProductUseCase,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private logger: LoggerService,
    private translationService: TranslationService,
    private headerActions: HeaderActionsService
  ) {
    addIcons({ analyticsOutline, refreshOutline, walletOutline });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.initialProductId = params['productId'] || null;
      });

    this.loadProducts();
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'products.balanceHistory.formTitle',
      showBackButton: true
    });
    this.loadProducts();
    if (this.currentFilter) {
      this.loadBalances(this.currentFilter);
    }
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProducts(): void {
    this.isProductsLoading = true;
    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products;
          this.isProductsLoading = false;
        },
        error: (error) => {
          this.logger.error('Error loading products', 'BalanceHistoryPage', error);
          this.isProductsLoading = false;
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
        },
        error: (error: JBHError) => {
          this.logger.error('Error loading balance history', 'BalanceHistoryPage', error);
          this.isLoading = false;
          this.hasData = false;
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('products.balanceHistory.errors.load');
          this.showToast(errorMessage, 'danger');
        }
      });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}
