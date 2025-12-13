import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MenuController } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

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
  imports: [CommonModule, IonicModule, TranslateModule]
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
    public translationService: TranslationService
  ) {}

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

  private handleLogout(): void {
    // TODO: Implement logout logic
    console.log('Logout clicked');
    // Example: this.authService.logout();
    // this.router.navigate(['/login']);
  }
}
