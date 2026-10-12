import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { UpdateTeamRequest, TeamWithMembers } from '@core/domain/features/teams';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhPageHeaderComponent,
  JbhSpinnerComponent,
  JbhTextFieldComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-edit-team',
  templateUrl: './edit-team.page.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSpinnerComponent,
    JbhTextFieldComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTeamPage implements OnInit, OnDestroy {

  teamForm!: FormGroup;
  isSubmitting = false;
  isLoading = true;
  teamId: string | null = null;
  team: TeamWithMembers | null = null;

  private destroy$ = new Subject<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly teamUseCase = inject(TeamUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initForm();
    this.teamId = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'teams.edit.title',
      showBackButton: true,
      defaultBackHref: '/settings/teams/overview'
    });
    this.loadTeam();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private loadTeam(): void {
    if (!this.teamId) {
      this.navigateToOverview();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.team = teams.find(t => t.id === this.teamId) || null;
          if (this.team) {
            this.populateForm();
          } else {
            this.toast.show(this.translationService.instant('teams.edit.errors.notFound'), 'error');
            this.navigateToOverview();
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading team:', 'EditTeamPage', error);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('teams.edit.errors.load'), 'error');
          this.navigateToOverview();
        }
      });
  }

  private populateForm(): void {
    if (this.team) {
      this.teamForm.patchValue({
        shortName: this.team.shortName,
        name: this.team.name
      });
    }
  }

  navigateToOverview(): void {
    this.router.navigate(['/teams/overview']);
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
    if (this.teamForm.invalid || !this.teamId) {
      this.markFormGroupTouched(this.teamForm);
      return;
    }

    this.isSubmitting = true;

    const request: UpdateTeamRequest = {
      shortName: this.teamForm.value.shortName,
      name: this.teamForm.value.name
    };

    this.teamUseCase.updateTeam(this.teamId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          await this.toast.show(this.translationService.instant('teams.edit.success'), 'success');
          this.router.navigate(['/teams/overview']);
        },
        error: async (error) => {
          this.logger.error('Error updating team:', 'EditTeamPage', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
          const errorMessage = (error instanceof JBHError && error.isValidationError)
            ? error.message
            : this.translationService.instant('teams.edit.errors.update');
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
      return this.translationService.instant(`teams.edit.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`teams.edit.${fieldName}.minlength`, { minLength });
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return this.translationService.instant(`teams.edit.${fieldName}.maxlength`, { maxLength });
    }
    if (field.hasError('pattern')) {
      return this.translationService.instant(`teams.edit.${fieldName}.pattern`);
    }
    return this.translationService.instant('validation.pattern');
  }
}
