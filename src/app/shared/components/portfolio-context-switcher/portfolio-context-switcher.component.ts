import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { TeamUseCase } from '@core/domain/use-cases/team.use-case';
import { ProductUseCase } from '@core/domain/use-cases/product.use-case';
import { ViewportService, SelectInterface } from '@core/infrastructure/viewport/viewport.service';
import { TeamWithMembers } from '@core/domain/features/teams';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Component({
  selector: 'app-portfolio-context-switcher',
  templateUrl: './portfolio-context-switcher.component.html',
  styleUrls: ['./portfolio-context-switcher.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioContextSwitcherComponent implements OnInit, OnDestroy {
  currentContext$ = this.portfolioContext.context$;
  teams: TeamWithMembers[] = [];
  selectInterface: SelectInterface = 'action-sheet';
  private destroy$ = new Subject<void>();

  constructor(
    private portfolioContext: PortfolioContextService,
    private teamUseCase: TeamUseCase,
    private productUseCase: ProductUseCase,
    private viewportService: ViewportService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.selectInterface = this.viewportService.selectInterface;
    this.loadTeams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTeams(): void {
    this.teamUseCase.getMyTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.teams = teams;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading teams for context switcher', 'ContextSwitcher', error);
        }
      });
  }

  async onContextChange(event: any): Promise<void> {
    const value = event.detail.value;

    if (value === 'personal') {
      await this.portfolioContext.switchToPersonal();
    } else {
      const teamId = value.replace('team_', '');
      const team = this.teams.find(t => t.id === teamId);
      if (team) {
        await this.portfolioContext.switchToTeam(team.id, team.name);
      }
    }

    this.clearAllCaches();
  }

  private clearAllCaches(): void {
    this.productUseCase.clearProductsCache();
  }

  getContextValue(): string {
    const context = this.portfolioContext.getCurrentContext();
    return context.isPersonal ? 'personal' : `team_${context.teamId}`;
  }
}
