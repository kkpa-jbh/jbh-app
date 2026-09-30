import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { IonicModule, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  close,
  cloudUploadOutline,
  documentTextOutline,
  informationCircleOutline,
  lockClosedOutline,
  warningOutline
} from 'ionicons/icons';
import { StatementUseCase } from '@core/domain/use-cases/statement.use-case';
import { StatementClassification } from '@core/domain/features/statements';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
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
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    AppHeaderComponent,
    JbhCurrencyPipe,
    JbhDisplayNamePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportStatementPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  statementForm!: FormGroup;
  selectedFile: File | null = null;
  result: StatementClassification | null = null;
  isProcessing = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private statementUseCase: StatementUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private headerActions: HeaderActionsService
  ) {
    addIcons({
      close,
      cloudUploadOutline,
      documentTextOutline,
      informationCircleOutline,
      lockClosedOutline,
      warningOutline
    });
  }

  ngOnInit(): void {
    this.statementForm = this.formBuilder.group({
      password: ['']
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'transactions.importStatement.title'
    });
    this.resetState();
  }

  ionViewWillLeave(): void {
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
          await this.showToast(errorMessage, 'danger');
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

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [
        {
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
