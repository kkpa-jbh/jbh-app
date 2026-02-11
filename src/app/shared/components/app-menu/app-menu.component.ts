import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MenuController, ToastController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import {
  appsOutline,
  homeOutline,
  personOutline,
  cubeOutline,
  addCircleOutline,
  listOutline,
  swapHorizontalOutline,
  logOutOutline,
  chevronUpOutline,
  chevronDownOutline,
  peopleOutline,
  personAddOutline,
  analyticsOutline,
  gridOutline,
  briefcaseOutline,
  cashOutline,
  trendingUpOutline,
  barChartOutline,
  settingsOutline,
  notificationsOutline
} from 'ionicons/icons';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { InstallAppButtonComponent } from '../install-app-button/install-app-button.component';
import { PortfolioContextSwitcherComponent } from '../portfolio-context-switcher/portfolio-context-switcher.component';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';

export interface MenuItem {
  id: string;
  translationKey: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  expanded?: boolean;
  action?: () => void;
  divider?: boolean;
}

@Component({
  selector: 'app-menu',
  templateUrl: './app-menu.component.html',
  styleUrls: ['./app-menu.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, InstallAppButtonComponent, PortfolioContextSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppMenuComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentContext$ = this.portfolioContext.context$;
  menuItems: MenuItem[] = [];
  currentYear = new Date().getFullYear();
  appVersion!: string;

  constructor(
    private router: Router,
    private menuController: MenuController,
    private authUseCase: AuthUseCase,
    private toastController: ToastController,
    public translationService: TranslationService,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private portfolioContext: PortfolioContextService,
    private environmentConfig: EnvironmentConfig
  ) {
    addIcons({
      appsOutline,
      homeOutline,
      personOutline,
      cubeOutline,
      addCircleOutline,
      listOutline,
      swapHorizontalOutline,
      logOutOutline,
      chevronUpOutline,
      chevronDownOutline,
      peopleOutline,
      personAddOutline,
      analyticsOutline,
      gridOutline,
      briefcaseOutline,
      cashOutline,
      trendingUpOutline,
      barChartOutline,
      settingsOutline,
      notificationsOutline
    });
  }

  ngOnInit(): void {
    this.appVersion = this.environmentConfig.appVersion;
    this.buildMenuItems();

    this.currentContext$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildMenuItems();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildMenuItems(): void {
    const context = this.portfolioContext.getCurrentContext();

    this.menuItems = [
      {
        id: 'dashboard',
        translationKey: 'menu.dashboard',
        icon: 'grid-outline',
        route: '/dashboard'
      },
      {
        id: 'portfolio',
        translationKey: 'menu.portfolio.title',
        icon: 'briefcase-outline',
        expanded: false,
        children: [
          {
            id: 'portfolio-view',
            translationKey: 'menu.portfolio.viewAll',
            icon: 'list-outline',
            route: '/portfolio/overview'
          },
          ...(context.isPersonal ? [{
            id: 'portfolio-add',
            translationKey: 'menu.portfolio.addNew',
            icon: 'add-circle-outline',
            route: '/portfolio/create'
          }] : [])
        ]
      },
      ...(context.isPersonal ? [{
        id: 'transactions',
        translationKey: 'menu.transactions.title',
        icon: 'swap-horizontal-outline',
        expanded: false,
        children: [
          {
            id: 'transactions-transfer',
            translationKey: 'menu.transactions.transfer',
            icon: 'swap-horizontal-outline',
            route: '/transactions/transfer'
          },
          {
            id: 'transactions-movement',
            translationKey: 'menu.transactions.recordMovement',
            icon: 'cash-outline',
            route: '/transactions/record-movement'
          }
        ]
      }] : []),
      {
        id: 'reports',
        translationKey: 'menu.reports.title',
        icon: 'analytics-outline',
        expanded: false,
        children: [
          {
            id: 'reports-balance-trends',
            translationKey: 'menu.reports.balanceTrends',
            icon: 'trending-up-outline',
            route: '/reports/balance-trends'
          },
          {
            id: 'reports-growth',
            translationKey: 'menu.reports.growthAnalysis',
            icon: 'bar-chart-outline',
            route: '/reports/growth-analysis'
          }
        ]
      },
      {
        id: 'settings',
        translationKey: 'menu.settings.title',
        icon: 'settings-outline',
        expanded: false,
        children: [
          {
            id: 'settings-preferences',
            translationKey: 'menu.settings.myPreferences',
            icon: 'person-outline',
            route: '/settings/preferences'
          },
          ...(context.isTeam ? [{
            id: 'settings-team-preferences',
            translationKey: 'menu.settings.teamPreferences',
            icon: 'notifications-outline',
            route: '/settings/team-preferences'
          }] : []),
          ...(context.isPersonal ? [{
            id: 'settings-team-management',
            translationKey: 'menu.settings.teamManagement.title',
            icon: 'people-outline',
            expanded: false,
            children: [
              {
                id: 'settings-teams-overview',
                translationKey: 'menu.settings.teamManagement.myTeams',
                icon: 'list-outline',
                route: '/settings/teams/overview'
              },
              {
                id: 'settings-teams-create',
                translationKey: 'menu.settings.teamManagement.addNew',
                icon: 'add-circle-outline',
                route: '/settings/teams/create'
              },
              {
                id: 'settings-teams-invite',
                translationKey: 'menu.settings.teamManagement.invite',
                icon: 'person-add-outline',
                route: '/settings/teams/invite'
              }
            ]
          }] : [])
        ]
      },
      {
        id: 'divider-1',
        translationKey: '',
        icon: '',
        divider: true
      },
      {
        id: 'logout',
        translationKey: 'menu.logout',
        icon: 'log-out-outline',
        action: () => this.handleLogout()
      }
    ];
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
      this.cdr.markForCheck();
    }
  }

  async navigateToRoute(route: string): Promise<void> {
    await this.menuController.close();
    await this.router.navigate([route]);
  }

  async handleMenuItemClick(item: MenuItem, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    if (item.action) {
      item.action();
      await this.menuController.close();
    } else if (item.route) {
      await this.navigateToRoute(item.route);
    } else if (item.children) {
      this.toggleSubmenu(item);
    }
  }

  isActive(item: MenuItem): boolean {
    if (item.route) {
      return this.router.url === item.route;
    }
    if (item.children) {
      return item.children.some(child => this.router.url === child.route);
    }
    return false;
  }

  private handleLogout(): void {
    this.authUseCase.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await this.showToast(
            this.translationService.instant('menu.logoutSuccess'),
            'success'
          );
          await this.router.navigate(['/login']);
        },
        error: async (error) => {
          this.logger.error('Logout error:', 'AppMenu', error);
          await this.showToast(
            this.translationService.instant('menu.logoutError'),
            'danger'
          );
        }
      });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
