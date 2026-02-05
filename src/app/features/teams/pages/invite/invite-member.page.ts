import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  mailOutline,
  personOutline,
  peopleOutline,
  sendOutline,
  informationCircle,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { TeamWithMembers } from '@core/domain/models/team.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { ViewportService, SelectInterface } from '@core/infrastructure/viewport/viewport.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { InviteMemberRequest } from '../../../../core/domain/repositories/team.repository';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-invite-member',
  templateUrl: './invite-member.page.html',
  styleUrls: ['./invite-member.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    AppHeaderComponent
  ]
})
export class InviteMemberPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  inviteForm!: FormGroup;
  teams: TeamWithMembers[] = [];
  isLoadingTeams = true;
  isSubmitting = false;
  preselectedTeamId: string | null = null;

  checkingUser = false;
  userExists: boolean | null = null;
  userCheckMessage = '';
  selectInterface: SelectInterface = 'action-sheet';

  private destroy$ = new Subject<void>();
  private userCheck$ = new Subject<string>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private teamUseCase: TeamUseCase,
    private authUseCase: AuthUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService,
    private viewportService: ViewportService,
    private headerActions: HeaderActionsService
  ) {
    this.selectInterface = this.viewportService.selectInterface;
    addIcons({
      mailOutline,
      personOutline,
      peopleOutline,
      sendOutline,
      informationCircle,
      checkmarkCircleOutline,
      closeCircleOutline
    });
  }

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

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'teams.invite.title'
    });
    this.loadTeams();
    this.resetForm();
    this.checkPreselectedTeam();
  }

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private checkPreselectedTeam(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['teamId']) {
        this.preselectedTeamId = params['teamId'];
        if (this.inviteForm) {
          this.inviteForm.patchValue({ teamId: this.preselectedTeamId });
        }
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
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.teams = teams;
          this.isLoadingTeams = false;
          if (this.preselectedTeamId) {
            this.inviteForm.patchValue({ teamId: this.preselectedTeamId });
          }
        },
        error: (error) => {
          this.logger.error('Error loading teams:', 'InviteMemberPage', error);
          this.isLoadingTeams = false;
          this.showToast(this.translationService.instant('teams.invite.errors.loadTeams'), 'danger');
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
      });

    this.userCheck$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(value => {
          this.checkingUser = true;
          this.userExists = null;
          this.userCheckMessage = '';

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
        },
        error: (error) => {
          this.logger.error('Error checking user:', 'InviteMemberPage', error);
          this.checkingUser = false;
          this.userExists = null;
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

    const { emailOrUsername, teamId } = this.inviteForm.value;
    const teamName = this.teams.find(t => t.id === teamId)?.name || '';
    const request: InviteMemberRequest = { emailOrUsername, teamName , teamID: teamId };
    this.teamUseCase.inviteMember(
      request
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.isSubmitting = false;
          await this.showToast(this.translationService.instant('teams.invite.success'), 'success');
          this.router.navigate(['/teams/overview']);
        },
        error: async (error) => {
          this.logger.error('Error inviting member:', 'InviteMemberPage', error);
          this.isSubmitting = false;
          const errorMessage = error?.error || this.translationService.instant('teams.invite.errors.invite');
          await this.showToast(errorMessage, 'danger');
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

  get isTeamDisabled(): boolean {
    return !!this.preselectedTeamId;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
