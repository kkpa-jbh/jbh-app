import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { APP_CONFIG_TOKEN, AppConfig } from '@core/infrastructure/config/app.config';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  createOutline,
  trashOutline,
  refreshOutline,
  mailOutline,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  timeOutline,
  shieldOutline,
  addOutline,
  chevronDownOutline,
  chevronUpOutline,
  personAddOutline
} from 'ionicons/icons';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { TeamWithMembers, TeamMember, MemberStatus } from '@core/domain/features/teams';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { InviteMemberRequest } from '../../../../core/domain/repositories/team.repository';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-overview-team',
  templateUrl: './overview-team.page.html',
  styleUrls: ['./overview-team.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    AppHeaderComponent
  ]
})
export class OverviewTeamPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {

  teams: TeamWithMembers[] = [];
  isLoading = true;
  expandedTeams: Set<string> = new Set();

  readonly MemberStatus = MemberStatus;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private teamUseCase: TeamUseCase,
    private authUseCase: AuthUseCase,
    private translationService: TranslationService,
    private toastController: ToastController,
    private alertController: AlertController,
    private logger: LoggerService,
    private headerActions: HeaderActionsService,
    @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig
  ) {
    addIcons({
      peopleOutline,
      createOutline,
      trashOutline,
      refreshOutline,
      mailOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      timeOutline,
      shieldOutline,
      addOutline,
      chevronDownOutline,
      chevronUpOutline,
      personAddOutline
    });
  }

  ngOnInit(): void {
    this.loadTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
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

  ionViewWillLeave(): void {
    this.headerActions.clearPageConfig();
  }

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
        },
        error: (error) => {
          this.logger.error('Error loading teams:', 'OverviewTeamPage', error);
          this.isLoading = false;
          this.showToast(this.translationService.instant('teams.overview.errors.load'), 'danger');
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
        },
        error: (error) => {
          this.logger.error('Error refreshing teams:', 'OverviewTeamPage', error);
          this.isLoading = false;
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
    const alert = await this.alertController.create({
      header: this.translationService.instant('teams.overview.deleteTeam.title'),
      message: this.translationService.instant('teams.overview.deleteTeam.message', { name: team.name }),
      buttons: [
        {
          text: this.translationService.instant('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.instant('common.delete'),
          role: 'destructive',
          handler: () => this.deleteTeam(team)
        }
      ]
    });
    await alert.present();
  }

  private deleteTeam(team: TeamWithMembers): void {
    this.teamUseCase.deleteTeam(team.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.teams = this.teams.filter(t => t.id !== team.id);
          this.showToast(this.translationService.instant('teams.overview.deleteTeam.success'), 'success');
        },
        error: (error) => {
          this.logger.error('Error deleting team:', 'OverviewTeamPage', error);
          this.showToast(this.translationService.instant('teams.overview.deleteTeam.error'), 'danger');
        }
      });
  }

  editTeam(team: TeamWithMembers): void {
    this.router.navigate(['/teams/edit', team.id]);
  }

  async confirmDeleteMember(team: TeamWithMembers, member: TeamMember): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translationService.instant('teams.overview.deleteMember.title'),
      message: this.translationService.instant('teams.overview.deleteMember.message', { name: member.nickName }),
      buttons: [
        {
          text: this.translationService.instant('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.instant('common.delete'),
          role: 'destructive',
          handler: () => this.deleteMember(team, member)
        }
      ]
    });
    await alert.present();
  }

  private deleteMember(team: TeamWithMembers, member: TeamMember): void {
    this.teamUseCase.deleteMember(team.id, member.email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshTeams();
          this.showToast(this.translationService.instant('teams.overview.deleteMember.success'), 'success');
        },
        error: (error) => {
          this.logger.error('Error deleting member:', 'OverviewTeamPage', error);
          this.showToast(this.translationService.instant('teams.overview.deleteMember.error'), 'danger');
        }
      });
  }

  async confirmReinviteMember(team: TeamWithMembers, member: TeamMember): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translationService.instant('teams.overview.reinviteMember.title'),
      message: this.translationService.instant('teams.overview.reinviteMember.message', { name: member.nickName }),
      buttons: [
        {
          text: this.translationService.instant('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.translationService.instant('teams.overview.reinviteMember.confirm'),
          handler: () => this.reinviteMember(team, member)
        }
      ]
    });
    await alert.present();
  }

  private reinviteMember(team: TeamWithMembers, member: TeamMember): void {
     const request: InviteMemberRequest = { emailOrUsername: member.email, teamName: team.name, teamID: team.id };
    this.teamUseCase.reinviteMember(team.id, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.refreshTeams();
          this.showToast(this.translationService.instant('teams.overview.reinviteMember.success'), 'success');
        },
        error: (error) => {
          this.logger.error('Error reinviting member:', 'OverviewTeamPage', error);
          this.showToast(this.translationService.instant('teams.overview.reinviteMember.error'), 'danger');
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
