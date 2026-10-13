import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { TeamWithMembers } from '@core/domain/features/teams';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { InviteMemberRequest } from '../../../../core/domain/repositories/team.repository';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhIconComponent,
  JbhPageHeaderComponent,
  JbhSelectComponent,
  JbhSelectOptionComponent,
  JbhSpinnerComponent,
  JbhTextFieldComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-invite-member',
  templateUrl: './invite-member.page.html',
  styleUrls: ['./invite-member.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSelectComponent,
    JbhSelectOptionComponent,
    JbhSpinnerComponent,
    JbhTextFieldComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InviteMemberPage implements OnInit, OnDestroy {

  inviteForm!: FormGroup;
  teams: TeamWithMembers[] = [];
  isLoadingTeams = true;
  isSubmitting = false;
  preselectedTeamId: string | null = null;

  checkingUser = false;
  userExists: boolean | null = null;
  userCheckMessage = '';

  private destroy$ = new Subject<void>();
  private userCheck$ = new Subject<string>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly teamUseCase = inject(TeamUseCase);
  private readonly authUseCase = inject(AuthUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.initForm();
    this.loadTeams();
    this.setupUserCheck();
    this.checkPreselectedTeam();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'teams.invite.formTitle'
    });
    this.loadTeams();
    this.resetForm();
    this.checkPreselectedTeam();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private checkPreselectedTeam(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['teamId']) {
        this.preselectedTeamId = params['teamId'];
        if (this.inviteForm) {
          this.inviteForm.patchValue({ teamId: this.preselectedTeamId });
          // A disabled control keeps the team fixed; the select has no disabled input of its own.
          this.inviteForm.get('teamId')?.disable();
        }
        this.cdr.markForCheck();
      }
    });
  }

  private resetForm(): void {
    if (!this.preselectedTeamId) {
      this.inviteForm.reset();
    } else {
      this.inviteForm.patchValue({ emailOrUsername: '', teamId: this.preselectedTeamId });
    }
    this.inviteForm.markAsPristine();
    this.inviteForm.markAsUntouched();
    this.userExists = null;
    this.userCheckMessage = '';
  }

  private initForm(): void {
    this.inviteForm = this.formBuilder.group({
      emailOrUsername: ['', [Validators.required, Validators.minLength(3)]],
      teamId: ['', [Validators.required]]
    });
  }

  private loadTeams(): void {
    this.isLoadingTeams = true;
    this.cdr.markForCheck();
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.teams = teams;
          this.isLoadingTeams = false;
          if (this.preselectedTeamId) {
            this.inviteForm.patchValue({ teamId: this.preselectedTeamId });
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading teams:', 'InviteMemberPage', error);
          this.isLoadingTeams = false;
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('teams.invite.errors.loadTeams'), 'error');
        }
      });
  }

  private setupUserCheck(): void {
    this.inviteForm.get('emailOrUsername')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe(value => {
        if (value && value.length >= 3) {
          this.userCheck$.next(value);
        } else {
          this.userExists = null;
          this.userCheckMessage = '';
        }
        this.cdr.markForCheck();
      });

    this.userCheck$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(value => {
          this.checkingUser = true;
          this.userExists = null;
          this.userCheckMessage = '';
          this.cdr.markForCheck();

          const isEmail = this.isEmail(value);
          if (isEmail) {
            return this.authUseCase.checkEmailAvailability(value).pipe(
              switchMap(result => of({ isEmail: true, available: result.available, value }))
            );
          } else {
            return this.authUseCase.checkUsernameAvailability(value).pipe(
              switchMap(result => of({ isEmail: false, available: result.available, value }))
            );
          }
        })
      )
      .subscribe({
        next: (result) => {
          this.checkingUser = false;
          this.userExists = !result.available;
          if (this.userExists) {
            this.userCheckMessage = result.isEmail
              ? this.translationService.instant('teams.invite.userFound.email')
              : this.translationService.instant('teams.invite.userFound.username');
          } else {
            this.userCheckMessage = result.isEmail
              ? this.translationService.instant('teams.invite.userNotFound.email')
              : this.translationService.instant('teams.invite.userNotFound.username');
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error checking user:', 'InviteMemberPage', error);
          this.checkingUser = false;
          this.userExists = null;
          this.cdr.markForCheck();
        }
      });
  }

  private isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  onSubmit(): void {
    if (this.inviteForm.invalid || !this.userExists) {
      this.markFormGroupTouched(this.inviteForm);
      return;
    }

    this.isSubmitting = true;

    // getRawValue keeps the team id when the control is disabled for a preselected team.
    const { emailOrUsername, teamId } = this.inviteForm.getRawValue();
    const teamName = this.teams.find(t => t.id === teamId)?.name || '';
    const request: InviteMemberRequest = { emailOrUsername, teamName , teamID: teamId };
    this.teamUseCase.inviteMember(
      request
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
          await this.toast.show(this.translationService.instant('teams.invite.success'), 'success');
          this.router.navigate(['/teams/overview']);
        },
        error: async (error) => {
          this.logger.error('Error inviting member:', 'InviteMemberPage', error);
          this.isSubmitting = false;
          this.cdr.markForCheck();
          const errorMessage = error?.error || this.translationService.instant('teams.invite.errors.invite');
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
    const field = this.inviteForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.inviteForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`teams.invite.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`teams.invite.${fieldName}.minlength`, { minLength });
    }
    return this.translationService.instant('validation.pattern');
  }

  get canSubmit(): boolean {
    return this.inviteForm.valid && this.userExists === true && !this.isSubmitting && !this.checkingUser;
  }
}
