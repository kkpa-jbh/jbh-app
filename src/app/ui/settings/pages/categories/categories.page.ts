import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import { listOutline, trendingUpOutline, trendingDownOutline } from 'ionicons/icons';
import { CategoryUseCase } from '@core/domain/use-cases/category.use-case';
import { Category } from '@core/domain/features/categories';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { JbhDisplayNamePipe } from '@shared/pipes';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, AppHeaderComponent, JbhDisplayNamePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  isLoading = true;
  selectedSegment: 'INCOME' | 'EXPENSE' = 'INCOME';

  private destroy$ = new Subject<void>();

  constructor(
    private categoryUseCase: CategoryUseCase,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private headerActions: HeaderActionsService
  ) {
    addIcons({ listOutline, trendingUpOutline, trendingDownOutline });
  }

  ngOnInit(): void {}

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'categories.title'
    });
    this.loadCategories();
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSegmentChange(event: CustomEvent): void {
    this.selectedSegment = event.detail.value;
    this.cdr.markForCheck();
  }

  trackByCategoryId(index: number, category: Category): number {
    return category.id;
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      income: this.categoryUseCase.getIncomeCategories(),
      expense: this.categoryUseCase.getExpenseCategories()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ income, expense }) => {
          this.incomeCategories = income;
          this.expenseCategories = expense;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading categories', 'CategoriesPage', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
