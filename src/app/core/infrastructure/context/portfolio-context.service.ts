import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PortfolioContext, PortfolioContextType } from '../../domain/models/portfolio-context.model';
import { PortfolioContextStorageService } from '../persistence/portfolio-context-storage.service';
import { LoggerService } from '../logging/logger.service';

@Injectable({ providedIn: 'root' })
export class PortfolioContextService {
  private contextSubject = new BehaviorSubject<PortfolioContext>(
    PortfolioContext.createPersonal()
  );

  public context$: Observable<PortfolioContext> = this.contextSubject.asObservable();

  constructor(
    private storage: PortfolioContextStorageService,
    private logger: LoggerService
  ) {
    this.initializeContext();
  }

  private async initializeContext(): Promise<void> {
    try {
      const savedContext = await this.storage.getContext();
      if (savedContext) {
        this.contextSubject.next(savedContext);
        this.logger.info('Restored context from storage', 'PortfolioContext', savedContext);
      }
    } catch (error) {
      this.logger.error('Failed to restore context', 'PortfolioContext', error);
    }
  }

  getCurrentContext(): PortfolioContext {
    return this.contextSubject.value;
  }

  async switchToPersonal(): Promise<void> {
    const context = PortfolioContext.createPersonal();
    this.contextSubject.next(context);
    await this.storage.saveContext(context);
    this.logger.info('Switched to personal context', 'PortfolioContext');
  }

  async switchToTeam(teamId: string, teamName: string): Promise<void> {
    const context = PortfolioContext.createTeam(teamId, teamName);
    this.contextSubject.next(context);
    await this.storage.saveContext(context);
    this.logger.info('Switched to team context', 'PortfolioContext', { teamId, teamName });
  }

  isPersonalContext(): boolean {
    return this.contextSubject.value.isPersonal;
  }

  isTeamContext(): boolean {
    return this.contextSubject.value.isTeam;
  }

  getTeamId(): string | null {
    return this.contextSubject.value.teamId;
  }

  async clearContext(): Promise<void> {
    const context = PortfolioContext.createPersonal();
    this.contextSubject.next(context);
    await this.storage.clearContext();
    this.logger.info('Cleared context', 'PortfolioContext');
  }
}
