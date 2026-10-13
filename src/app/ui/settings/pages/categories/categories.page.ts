import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { CategoryUseCase } from '@core/domain/use-cases/category.use-case';
import { Category } from '@core/domain/features/categories';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhCardComponent,
  JbhEmptyStateComponent,
  JbhIconComponent,
  JbhSegmentComponent,
  JbhSkeletonComponent
} from '@design-system/components';
import { JbhPageComponent } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { JbhDisplayNamePipe } from '@shared/pipes';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    JbhCardComponent,
    JbhEmptyStateComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhSegmentComponent,
    JbhSkeletonComponent,
    AppHeaderComponent,
    JbhDisplayNamePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesPage implements OnDestroy {

  incomeCategories: Category[] = [];
  expenseCategories: Category[] = [];
  isLoading = true;
  selectedSegment: 'INCOME' | 'EXPENSE' = 'INCOME';

  private destroy$ = new Subject<void>();

  private readonly categoryUseCase = inject(CategoryUseCase);
  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'categories.title'
    });
    this.loadCategories();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSegmentChange(value: string): void {
    this.selectedSegment = value === 'EXPENSE' ? 'EXPENSE' : 'INCOME';
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
