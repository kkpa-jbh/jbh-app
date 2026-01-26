import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, ViewWillEnter } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  textOutline,
  informationCircle,
  saveOutline,
  close,
  alertCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { CreateTeamRequest } from '@core/domain/models/team.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { APP_CONFIG_TOKEN, AppConfig } from '@core/infrastructure/config/app.config';

@Component({
  selector: 'app-create-team',
  templateUrl: './create-team.page.html',
  styleUrls: ['./create-team.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule
  ]
})
export class CreateTeamPage implements OnInit, OnDestroy, ViewWillEnter {

  teamForm!: FormGroup;
  isSubmitting = false;
  isCheckingLimit = true;
  currentTeamCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private teamUseCase: TeamUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService,
    @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig
  ) {
    addIcons({
      peopleOutline,
      textOutline,
      informationCircle,
      saveOutline,
      close,
      alertCircleOutline,
      arrowBackOutline
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.checkTeamLimit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.resetForm();
    this.checkTeamLimit();
  }

  private checkTeamLimit(): void {
    this.isCheckingLimit = true;
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.currentTeamCount = teams.length;
          this.isCheckingLimit = false;
        },
        error: (error) => {
          this.logger.error('Error checking team limit:', 'CreateTeamPage', error);
          this.isCheckingLimit = false;
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

  private initForm(): void {
    this.teamForm = this.formBuilder.group({
      shortName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]]
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
          await this.showToast(this.translationService.instant('teams.create.success'), 'success');
          this.router.navigate(['/teams/overview']);
        },
        error: async (error) => {
          this.logger.error('Error creating team:', 'CreateTeamPage', error);
          this.isSubmitting = false;
          const errorMessage = error?.error?.message || this.translationService.instant('teams.create.errors.create');
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
    return this.translationService.instant('validation.pattern');
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
