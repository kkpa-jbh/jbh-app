import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { SlicePipe, UpperCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { APP_CONFIG_TOKEN } from '@core/infrastructure/config/app.config';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { TeamWithMembers, TeamMember, MemberStatus } from '@core/domain/features/teams';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { InviteMemberRequest } from '../../../../core/domain/repositories/team.repository';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import {
  JbhButtonComponent,
  JbhEmptyStateComponent,
  JbhIconButtonComponent,
  JbhIconComponent,
  JbhPageHeaderComponent,
  JbhSkeletonComponent,
  JbhTableCardDirective,
  JbhTableCellComponent,
  JbhTableComponent,
  JbhTableHeadDirective,
  JbhTableRowComponent,
  JbhTableRowDirective
} from '@design-system/components';
import { DialogService, JbhPageComponent, ToastService } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-overview-team',
  templateUrl: './overview-team.page.html',
  styleUrls: ['./overview-team.page.scss'],
  standalone: true,
  imports: [
    SlicePipe,
    UpperCasePipe,
    TranslateModule,
    JbhButtonComponent,
    JbhEmptyStateComponent,
    JbhIconButtonComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhPageHeaderComponent,
    JbhSkeletonComponent,
    JbhTableCardDirective,
    JbhTableCellComponent,
    JbhTableComponent,
    JbhTableHeadDirective,
    JbhTableRowComponent,
    JbhTableRowDirective,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewTeamPage implements OnInit, OnDestroy {

  teams: TeamWithMembers[] = [];
  isLoading = true;
  expandedTeams: Set<string> = new Set();

  readonly MemberStatus = MemberStatus;

  private destroy$ = new Subject<void>();

  private readonly router = inject(Router);
  private readonly teamUseCase = inject(TeamUseCase);
  private readonly authUseCase = inject(AuthUseCase);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly logger = inject(LoggerService);
  private readonly headerActions = inject(HeaderActionsService);
  private readonly appConfig = inject(APP_CONFIG_TOKEN);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'teams.overview.title',
      actions: [
        {
          id: 'refresh',
          icon: 'refresh-outline',
          handler: () => this.refreshTeams()
        }
      ]
    });
    this.refreshTeams();
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
  }

  trackByMember = (_index: number, member: TeamMember): string => member.email;

  private loadTeams(): void {
    this.isLoading = true;
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.teams = teams;
          this.isLoading = false;
          if (teams.length > 0) {
            this.expandedTeams.add(teams[0].id);
          }
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading teams:', 'OverviewTeamPage', error);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('teams.overview.errors.load'), 'error');
        }
      });
  }

  refreshTeams(): void {
    this.teamUseCase.refreshMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.teams = teams;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error refreshing teams:', 'OverviewTeamPage', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleTeamExpansion(teamId: string): void {
    if (this.expandedTeams.has(teamId)) {
      this.expandedTeams.delete(teamId);
    } else {
      this.expandedTeams.add(teamId);
    }
  }

  isTeamExpanded(teamId: string): boolean {
    return this.expandedTeams.has(teamId);
  }

  navigateToCreate(): void {
    this.router.navigate(['/teams/create']);
  }

  get canCreateTeam(): boolean {
    return this.teams.length < this.appConfig.teams.maxTeamsPerUser;
  }

  get maxTeams(): number {
    return this.appConfig.teams.maxTeamsPerUser;
  }

  navigateToInvite(teamId: string): void {
    this.router.navigate(['/teams/invite'], { queryParams: { teamId } });
  }

  async confirmDeleteTeam(team: TeamWithMembers): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.translationService.instant('teams.overview.deleteTeam.title'),
      message: this.translationService.instant('teams.overview.deleteTeam.message', { name: team.name }),
      confirmText: this.translationService.instant('common.delete'),
      destructive: true
    });
    if (confirmed) {
      this.deleteTeam(team);
    }
  }

  private deleteTeam(team: TeamWithMembers): void {
    this.teamUseCase.deleteTeam(team.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.teams = this.teams.filter(t => t.id !== team.id);
          this.cdr.markForCheck();
          this.toast.show(this.translationService.instant('teams.overview.deleteTeam.success'), 'success');
        },
        error: (error) => {
          this.logger.error('Error deleting team:', 'OverviewTeamPage', error);
          this.toast.show(this.translationService.instant('teams.overview.deleteTeam.error'), 'error');
        }
      });
  }

  editTeam(team: TeamWithMembers): void {
    this.router.navigate(['/teams/edit', team.id]);
  }

  async confirmDeleteMember(team: TeamWithMembers, member: TeamMember): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.translationService.instant('teams.overview.deleteMember.title'),
      message: this.translationService.instant('teams.overview.deleteMember.message', { name: member.nickName }),
      confirmText: this.translationService.instant('common.delete'),
      destructive: true
    });
    if (confirmed) {
      this.deleteMember(team, member);
    }
  }

  private deleteMember(team: TeamWithMembers, member: TeamMember): void {
    this.teamUseCase.deleteMember(team.id, member.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshTeams();
          this.toast.show(this.translationService.instant('teams.overview.deleteMember.success'), 'success');
        },
        error: (error) => {
          this.logger.error('Error deleting member:', 'OverviewTeamPage', error);
          this.toast.show(this.translationService.instant('teams.overview.deleteMember.error'), 'error');
        }
      });
  }

  async confirmReinviteMember(team: TeamWithMembers, member: TeamMember): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.translationService.instant('teams.overview.reinviteMember.title'),
      message: this.translationService.instant('teams.overview.reinviteMember.message', { name: member.nickName }),
      confirmText: this.translationService.instant('teams.overview.reinviteMember.confirm')
    });
    if (confirmed) {
      this.reinviteMember(team, member);
    }
  }

  private reinviteMember(team: TeamWithMembers, member: TeamMember): void {
     const request: InviteMemberRequest = { emailOrUsername: member.email, teamName: team.name, teamID: team.id };
    this.teamUseCase.reinviteMember(team.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshTeams();
          this.toast.show(this.translationService.instant('teams.overview.reinviteMember.success'), 'success');
        },
        error: (error) => {
          this.logger.error('Error reinviting member:', 'OverviewTeamPage', error);
          this.toast.show(this.translationService.instant('teams.overview.reinviteMember.error'), 'error');
        }
      });
  }

  getStatusClass(status: MemberStatus): string {
    switch (status) {
      case MemberStatus.ACCEPTED:
        return 'status-accepted';
      case MemberStatus.PENDING_TO_ACCEPT:
        return 'status-pending';
      case MemberStatus.DECLINED:
        return 'status-declined';
      default:
        return '';
    }
  }

  getStatusIcon(status: MemberStatus): string {
    switch (status) {
      case MemberStatus.ACCEPTED:
        return 'checkmark-circle-outline';
      case MemberStatus.PENDING_TO_ACCEPT:
        return 'time-outline';
      case MemberStatus.DECLINED:
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  }

  canReinvite(member: TeamMember): boolean {
    return member.status === MemberStatus.DECLINED || member.status === MemberStatus.PENDING_TO_ACCEPT;
  }

  canDelete(member: TeamMember): boolean {
    return !member.isGroupOwner;
  }

  isTeamOwner(team: TeamWithMembers): boolean {
    const currentUser = this.authUseCase.getCurrentUser();
    if (!currentUser) return false;
    return team.owner?.email === currentUser.email;
  }
}
