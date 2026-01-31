import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  mailOutline,
  arrowForwardOutline,
  homeOutline
} from 'ionicons/icons';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

type PageState = 'loading' | 'ready' | 'accepting' | 'success' | 'error';

@Component({
  selector: 'app-accept-invitation',
  templateUrl: './accept-invitation.page.html',
  styleUrls: ['./accept-invitation.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule
  ]
})
export class AcceptInvitationPage implements OnInit, OnDestroy {

  pageState: PageState = 'loading';
  teamId: string | null = null;
  teamName: string | null = null;
  errorMessage = '';
  successTeamName = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamUseCase: TeamUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private logger: LoggerService
  ) {
    addIcons({
      peopleOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      mailOutline,
      arrowForwardOutline,
      homeOutline
    });
  }

  ngOnInit(): void {
    this.extractParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractParams(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.teamId = params.get('teamId');

        if (!this.teamId) {
          this.pageState = 'error';
          this.errorMessage = this.translationService.instant('teams.acceptInvitation.errors.invalidLink');
          return;
        }

        this.route.queryParamMap
          .pipe(takeUntil(this.destroy$))
          .subscribe(queryParams => {
            const encodedTeamName = queryParams.get('teamName');
            if (encodedTeamName) {
              try {
                this.teamName = decodeURIComponent(encodedTeamName);
              } catch {
                this.teamName = encodedTeamName;
              }
            }
            this.pageState = 'ready';
          });
      });
  }

  acceptInvitation(): void {
    if (!this.teamId || this.pageState === 'accepting') {
      return;
    }

    this.pageState = 'accepting';

    this.teamUseCase.acceptInvitation(this.teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          this.successTeamName = response.groupName || this.teamName || '';
          this.pageState = 'success';
          await this.showToast(
            this.translationService.instant('teams.acceptInvitation.success'),
            'success'
          );
        },
        error: async (error) => {
          this.logger.error('Error accepting invitation:', 'AcceptInvitationPage', error);
          this.pageState = 'error';
          this.errorMessage = this.getErrorMessage(error);
          await this.showToast(this.errorMessage, 'danger');
        }
      });
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof JBHError) {
      if (error.status === 404) {
        return this.translationService.instant('teams.acceptInvitation.errors.invitationNotFound');
      }
      if (error.status === 409) {
        return this.translationService.instant('teams.acceptInvitation.errors.alreadyMember');
      }
      if (error.status === 410) {
        return this.translationService.instant('teams.acceptInvitation.errors.invitationExpired');
      }
      if (error.isValidationError) {
        return error.message;
      }
    }

    return this.translationService.instant('teams.acceptInvitation.errors.generic');
  }

  navigateToTeams(): void {
    this.router.navigate(['/teams/overview']);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
