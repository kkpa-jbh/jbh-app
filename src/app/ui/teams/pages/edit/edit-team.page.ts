import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { UpdateTeamRequest, TeamWithMembers } from '@core/domain/features/teams';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Component({
  selector: 'app-edit-team',
  templateUrl: './edit-team.page.html',
  styleUrls: ['./edit-team.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule
  ]
})
export class EditTeamPage implements OnInit, OnDestroy, ViewWillEnter {

  teamForm!: FormGroup;
  isSubmitting = false;
  isLoading = true;
  teamId: string | null = null;
  team: TeamWithMembers | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private teamUseCase: TeamUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService
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
    this.teamId = this.route.snapshot.paramMap.get('id');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    this.loadTeam();
  }

  private loadTeam(): void {
    if (!this.teamId) {
      this.navigateToOverview();
      return;
    }

    this.isLoading = true;
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.team = teams.find(t => t.id === this.teamId) || null;
          if (this.team) {
            this.populateForm();
          } else {
            this.showToast(this.translationService.instant('teams.edit.errors.notFound'), 'danger');
            this.navigateToOverview();
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.logger.error('Error loading team:', 'EditTeamPage', error);
          this.isLoading = false;
          this.showToast(this.translationService.instant('teams.edit.errors.load'), 'danger');
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
          await this.showToast(this.translationService.instant('teams.edit.success'), 'success');
          this.router.navigate(['/teams/overview']);
        },
        error: async (error) => {
          this.logger.error('Error updating team:', 'EditTeamPage', error);
          this.isSubmitting = false;
          const errorMessage = (error instanceof JBHError && error.isValidationError)
            ? error.message
            : this.translationService.instant('teams.edit.errors.update');
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
