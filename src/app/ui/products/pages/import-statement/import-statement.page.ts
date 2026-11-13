import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, inject } from '@angular/core';
import { DatePipe, PercentPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { StatementUseCase } from '@core/domain/use-cases/statement.use-case';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { StatementImport } from '@core/domain/features/statements';
import { ProductListItem } from '@core/domain/features/products';
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
import { ProductSelectComponent } from '@shared/components/product-select/product-select.component';
import { JbhCurrencyPipe, JbhDisplayNamePipe } from '@shared/pipes';

/**
 * Upload a bank statement PDF into a product. The server reads, categorizes and saves its movements.
 *
 * The POST answers at once with an import id; the page then polls the import until it is DONE or FAILED
 * (see `StatementUseCase.importStatement`). Leaving the page stops the polling, not the import.
 * The PDF password is sent once in the multipart form and is never stored.
 *
 * Only SAVINGS and CREDIT_CARD products accept a statement (`ProductListItem.allowsStatementImport`).
 *
 * The date column uses Angular's `date` pipe, not `jbhDate`: `jbhDate` reads a `yyyy-MM-dd`
 * string as a `yyyy-MM` period and would show the first day of the month.
 * Saved amounts use `jbhCurrency` without a currency argument, like the add-movement flow.
 * Not-saved amounts pass their own currency, because the main reason to skip them is another currency.
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
    ProductSelectComponent,
    JbhCurrencyPipe,
    JbhDisplayNamePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportStatementPage implements OnInit, OnDestroy {

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  statementForm!: FormGroup;
  selectedFile: File | null = null;
  products: ProductListItem[] = [];
  isLoadingProducts = false;
  result: StatementImport | null = null;
  isProcessing = false;

  private importSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly statementUseCase = inject(StatementUseCase);
  private readonly productUseCase = inject(ProductUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly headerActions = inject(HeaderActionsService);

  ngOnInit(): void {
    this.statementForm = this.formBuilder.group({
      productId: ['', [Validators.required]],
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
    this.loadProducts();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
    this.stopPolling();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.result = null;
    this.cdr.markForCheck();
  }

  hasError(field: string): boolean {
    const control = this.statementForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  onSubmit(): void {
    if (!this.selectedFile || this.isProcessing) {
      return;
    }

    const productControl = this.statementForm.get('productId');
    if (!productControl || productControl.invalid) {
      productControl?.markAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.stopPolling();
    this.isProcessing = true;
    this.result = null;
    this.cdr.markForCheck();

    const productId: string = productControl.value;
    const password: string = this.statementForm.get('password')?.value ?? '';

    this.importSubscription = this.statementUseCase.importStatement(productId, this.selectedFile, password || null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statementImport) => this.onImportUpdate(statementImport),
        error: (error: JBHError | Error) => this.onImportError(error)
      });
  }

  private onImportUpdate(statementImport: StatementImport): void {
    this.result = statementImport;
    this.isProcessing = statementImport.isProcessing;
    this.cdr.markForCheck();

    if (statementImport.isDone) {
      const message = this.translationService.instant('transactions.importStatement.success', {
        count: statementImport.summary?.savedCount ?? statementImport.movements.length
      });
      this.toast.show(message, 'success');
    }
  }

  private onImportError(error: JBHError | Error): void {
    this.logger.error('Error importing statement:', 'ImportStatementPage', error);
    this.isProcessing = false;
    this.cdr.markForCheck();
    this.toast.show(this.importErrorMessage(error), 'error');
  }

  private importErrorMessage(error: JBHError | Error): string {
    if (error instanceof JBHError) {
      if (error.status === 409) {
        return this.translationService.instant('transactions.importStatement.errors.alreadyImported');
      }
      if (error.isValidationError) {
        return error.message;
      }
    }
    return this.translationService.instant('transactions.importStatement.errors.generic');
  }

  private loadProducts(): void {
    this.isLoadingProducts = true;
    this.statementForm.get('productId')?.disable();
    this.cdr.markForCheck();
    this.productUseCase.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products) => {
          this.products = products.filter(product => product.allowsStatementImport);
          if (this.products.length === 1) {
            this.statementForm.get('productId')?.setValue(this.products[0].id);
          }
          this.isLoadingProducts = false;
          this.statementForm.get('productId')?.enable();
          this.cdr.markForCheck();
        },
        error: (error: JBHError | Error) => {
          this.logger.error('Error loading products:', 'ImportStatementPage', error);
          this.isLoadingProducts = false;
          this.statementForm.get('productId')?.enable();
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('transactions.importStatement.errors.loadProducts'), 'error');
        }
      });
  }

  private stopPolling(): void {
    this.importSubscription?.unsubscribe();
    this.importSubscription = null;
  }

  private resetState(): void {
    this.stopPolling();
    this.selectedFile = null;
    this.result = null;
    this.isProcessing = false;
    this.products = [];
    this.statementForm.reset({ productId: '', password: '' });
    // Clear the native input, so picking the same file again fires (change).
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.markForCheck();
  }
}
