import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { CreateTeamRequest } from '@core/domain/features/teams';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { APP_CONFIG_TOKEN } from '@core/infrastructure/config/app.config';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhIconComponent,
  JbhPageHeaderComponent,
  JbhSpinnerComponent,
  JbhTextFieldComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-create-team',
  templateUrl: './create-team.page.html',
  styleUrls: ['./create-team.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSpinnerComponent,
    JbhTextFieldComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTeamPage implements OnInit, OnDestroy {

  teamForm!: FormGroup;
  isSubmitting = false;
  isCheckingLimit = true;
  currentTeamCount = 0;

  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly teamUseCase = inject(TeamUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly appConfig = inject(APP_CONFIG_TOKEN);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initForm();
    this.checkTeamLimit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'teams.create.formTitle'
    });
    this.resetForm();
    this.checkTeamLimit();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private checkTeamLimit(): void {
    this.isCheckingLimit = true;
    this.cdr.markForCheck();
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.currentTeamCount = teams.length;
          this.isCheckingLimit = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error checking team limit:', 'CreateTeamPage', error);
          this.isCheckingLimit = false;
          this.cdr.markForCheck();
        }
      });
  }

  get canCreateTeam(): boolean {
    return this.currentTeamCount < this.appConfig.teams.maxTeamsPerUser;
  }

  get maxTeams(): number {
    return this.appConfig.teams.maxTeamsPerUser;
  }

  navigateToOverview(): void {
    this.router.navigate(['/teams/overview']);
  }

  private resetForm(): void {
    this.teamForm.reset();
    this.teamForm.markAsPristine();
    this.teamForm.markAsUntouched();
  }

  private readonly TEAM_NAME_PATTERN = /^[^?&#\/\\<>"']+$/;

  private initForm(): void {
    this.teamForm = this.formBuilder.group({
      shortName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      name: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(this.TEAM_NAME_PATTERN)
      ]]
    });
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      this.markFormGroupTouched(this.teamForm);
      return;
    }

    this.isSubmitting = true;

    const request: CreateTeamRequest = {
      shortName: this.teamForm.value.shortName,
      name: this.teamForm.value.name
    };

    this.teamUseCase.createTeam(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          await this.toast.show(this.translationService.instant('teams.create.success'), 'success');
          this.router.navigate(['/teams/overview']);
        },
        error: async (error) => {
          this.logger.error('Error creating team:', 'CreateTeamPage', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
          const errorMessage = (error instanceof JBHError && error.isValidationError)
            ? error.message
            : this.translationService.instant('teams.create.errors.create');
          await this.toast.show(errorMessage, 'error');
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.teamForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`teams.create.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`teams.create.${fieldName}.minlength`, { minLength });
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return this.translationService.instant(`teams.create.${fieldName}.maxlength`, { maxLength });
    }
    if (field.hasError('pattern')) {
      return this.translationService.instant(`teams.create.${fieldName}.pattern`);
    }
    return this.translationService.instant('validation.pattern');
  }
}
