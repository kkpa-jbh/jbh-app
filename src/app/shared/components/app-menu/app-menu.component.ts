import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MenuController, ToastController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
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
  analyticsOutline
} from 'ionicons/icons';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { InstallAppButtonComponent } from '../install-app-button/install-app-button.component';

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
  imports: [CommonModule, IonicModule, TranslateModule, InstallAppButtonComponent]
})
export class AppMenuComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      id: 'home',
      translationKey: 'menu.home',
      icon: 'home-outline',
      route: '/home'
    },
    {
      id: 'profile',
      translationKey: 'menu.profile',
      icon: 'person-outline',
      route: '/profile'
    },
    {
      id: 'products',
      translationKey: 'menu.products.title',
      icon: 'cube-outline',
      expanded: false,
      children: [
        {
          id: 'create-product',
          translationKey: 'menu.products.create',
          icon: 'add-circle-outline',
          route: '/products/create'
        },
        {
          id: 'overview',
          translationKey: 'menu.products.overview',
          icon: 'list-outline',
          route: '/products/overview'
        },
        {
          id: 'transfer',
          translationKey: 'menu.products.transfer',
          icon: 'swap-horizontal-outline',
          route: '/products/transfer'
        },
        {
          id: 'balance-history',
          translationKey: 'menu.products.balanceHistory',
          icon: 'analytics-outline',
          route: '/products/balance-history'
        }
      ]
    },
    {
      id: 'teams',
      translationKey: 'menu.teams.title',
      icon: 'people-outline',
      expanded: false,
      children: [
        {
          id: 'create-team',
          translationKey: 'menu.teams.create',
          icon: 'add-circle-outline',
          route: '/teams/create'
        },
        {
          id: 'teams-overview',
          translationKey: 'menu.teams.overview',
          icon: 'list-outline',
          route: '/teams/overview'
        },
        {
          id: 'teams-invite',
          translationKey: 'menu.teams.invite',
          icon: 'person-add-outline',
          route: '/teams/invite'
        }
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

  constructor(
    private router: Router,
    private menuController: MenuController,
    private authUseCase: AuthUseCase,
    private toastController: ToastController,
    public translationService: TranslationService,
    private logger: LoggerService
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
      analyticsOutline
    });
  }

  ngOnInit(): void {}

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
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

  private async handleLogout(): Promise<void> {
    this.authUseCase.logout().subscribe({
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
