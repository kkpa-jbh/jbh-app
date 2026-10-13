import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, inject } from '@angular/core';
import { DatePipe, PercentPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { StatementUseCase } from '@core/domain/use-cases/statement.use-case';
import { StatementClassification } from '@core/domain/features/statements';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhAlertComponent,
  JbhButtonComponent,
  JbhCardComponent,
  JbhEmptyStateComponent,
  JbhIconComponent,
  JbhPageHeaderComponent,
  JbhTableCellComponent,
  JbhTableComponent,
  JbhTableHeadDirective,
  JbhTableRowComponent,
  JbhTableRowDirective,
  JbhTextFieldComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';
import { JbhCurrencyPipe, JbhDisplayNamePipe } from '@shared/pipes';

/**
 * Upload a bank statement PDF and show its movements with a suggested category.
 *
 * Nothing is saved. The PDF password is sent once in the multipart form and is never stored.
 *
 * The date column uses Angular's `date` pipe, not `jbhDate`: `jbhDate` reads a `yyyy-MM-dd`
 * string as a `yyyy-MM` period and would show the first day of the month.
 * The amount uses `jbhCurrency` without a currency argument, like the add-movement flow.
 */
@Component({
  selector: 'app-import-statement',
  templateUrl: './import-statement.page.html',
  styleUrls: ['./import-statement.page.scss'],
  standalone: true,
  imports: [
    DatePipe,
    PercentPipe,
    ReactiveFormsModule,
    TranslateModule,
    JbhAlertComponent,
    JbhButtonComponent,
    JbhCardComponent,
    JbhEmptyStateComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhTableCellComponent,
    JbhTableComponent,
    JbhTableHeadDirective,
    JbhTableRowComponent,
    JbhTableRowDirective,
    JbhTextFieldComponent,
    AppHeaderComponent,
    JbhCurrencyPipe,
    JbhDisplayNamePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportStatementPage implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  statementForm!: FormGroup;
  selectedFile: File | null = null;
  result: StatementClassification | null = null;
  isProcessing = false;

  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly statementUseCase = inject(StatementUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);

  ngOnInit(): void {
    this.statementForm = this.formBuilder.group({
      password: ['']
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'transactions.importStatement.title'
    });
    this.resetState();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.result = null;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (!this.selectedFile || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.result = null;
    this.cdr.markForCheck();

    const password: string = this.statementForm.get('password')?.value ?? '';

    this.statementUseCase.extractMovements(this.selectedFile, password || null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.result = result;
          this.isProcessing = false;
          this.cdr.markForCheck();
        },
        error: async (error: JBHError) => {
          this.logger.error('Error importing statement:', 'ImportStatementPage', error);
          this.isProcessing = false;
          this.cdr.markForCheck();
          const errorMessage = error.isValidationError
            ? error.message
            : this.translationService.instant('transactions.importStatement.errors.generic');
          await this.toast.show(errorMessage, 'error');
        }
      });
  }

  private resetState(): void {
    this.selectedFile = null;
    this.result = null;
    this.isProcessing = false;
    this.statementForm.reset({ password: '' });
    // Clear the native input, so picking the same file again fires (change).
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }
}
