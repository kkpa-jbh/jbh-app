import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import {
  JbhButtonComponent,
  JbhCardComponent,
  JbhIconComponent,
  JbhSpinnerComponent
} from '@design-system/components';
import { JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

type PageState = 'loading' | 'ready' | 'accepting' | 'success' | 'error';

@Component({
  selector: 'app-accept-invitation',
  templateUrl: './accept-invitation.page.html',
  styleUrls: ['./accept-invitation.page.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhSpinnerComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AcceptInvitationPage implements OnInit, OnDestroy {

  pageState: PageState = 'loading';
  teamId: string | null = null;
  teamName: string | null = null;
  errorMessage = '';
  successTeamName = '';

  private destroy$ = new Subject<void>();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamUseCase = inject(TeamUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.extractParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'teams.acceptInvitation.title'
    });
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  private extractParams(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.teamId = params.get('teamId');

        if (!this.teamId) {
          this.pageState = 'error';
          this.errorMessage = this.translationService.instant('teams.acceptInvitation.errors.invalidLink');
          this.cdr.markForCheck();
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
            this.cdr.markForCheck();
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
          this.cdr.markForCheck();
          await this.toast.show(
            this.translationService.instant('teams.acceptInvitation.success'),
            'success'
          );
        },
        error: async (error) => {
          this.logger.error('Error accepting invitation:', 'AcceptInvitationPage', error);
          this.pageState = 'error';
          this.errorMessage = this.getErrorMessage(error);
          this.cdr.markForCheck();
          await this.toast.show(this.errorMessage, 'error');
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
}
