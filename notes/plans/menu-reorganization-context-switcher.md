# JBH App - Menu Reorganization with Context Switcher

## Overview

Reorganize the JBH App navigation menu to use a context switcher pattern (Personal Portfolio ↔ Team Portfolio) instead of separate Products/Teams sections. Teams are read-only aggregated views, so the same menu structure works for both contexts with visibility rules.

## Final Menu Structure

```
[Context Switcher: Personal Portfolio ▼ | Team Alpha | Team Beta]

├─ 📊 Dashboard                    [Current HOME page]
├─ 💼 Portfolio
│  ├─ View All Products            [Current products/overview]
│  └─ Add New Product              [personal only]
├─ 💸 Transactions                  [personal only - entire menu hidden in team]
│  ├─ Transfer Funds               [products/transfer]
│  └─ Record Movement              [products/add-movement]
├─ 📈 Reports
│  ├─ Balance Trends               [products/balance-history]
│  └─ Growth Analysis              [future placeholder]
├─ ⚙️ Settings
│  ├─ My Preferences               [profile page]
│  ├─ Team Preferences             [only in team context]
│  └─ Team Management              [only in personal context]
│     ├─ My Teams                  [teams/overview]
│     ├─ Add New Team              [teams/create]
│     └─ Invite Members            [teams/invite]
└─ 🚪 Logout
```

## Implementation Phases

### Phase 1: Foundation - Context Management Service

**Priority: HIGHEST** - All other work depends on this

#### 1.1 Create PortfolioContext Domain Model

**File:** `src/app/core/domain/models/portfolio-context.model.ts`

```typescript
export enum PortfolioContextType {
  PERSONAL = 'PERSONAL',
  TEAM = 'TEAM'
}

export class PortfolioContext {
  constructor(
    public readonly type: PortfolioContextType,
    public readonly teamId: string | null = null,
    public readonly teamName: string | null = null
  ) {}

  get isPersonal(): boolean {
    return this.type === PortfolioContextType.PERSONAL;
  }

  get isTeam(): boolean {
    return this.type === PortfolioContextType.TEAM;
  }

  static createPersonal(): PortfolioContext {
    return new PortfolioContext(PortfolioContextType.PERSONAL);
  }

  static createTeam(teamId: string, teamName: string): PortfolioContext {
    return new PortfolioContext(PortfolioContextType.TEAM, teamId, teamName);
  }

  toJSON(): PortfolioContextJSON {
    return {
      type: this.type,
      teamId: this.teamId,
      teamName: this.teamName
    };
  }

  static fromJSON(json: PortfolioContextJSON): PortfolioContext {
    return new PortfolioContext(json.type, json.teamId, json.teamName);
  }
}

export interface PortfolioContextJSON {
  type: PortfolioContextType;
  teamId: string | null;
  teamName: string | null;
}
```

#### 1.2 Create PortfolioContextStorageService

**File:** `src/app/core/infrastructure/persistence/portfolio-context-storage.service.ts`

Pattern: Follow `TokenStorageService` using Capacitor Preferences

```typescript
import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { PortfolioContext, PortfolioContextJSON } from '../../domain/models/portfolio-context.model';

@Injectable({ providedIn: 'root' })
export class PortfolioContextStorageService {
  private readonly CONTEXT_KEY = 'jbh_portfolio_context';

  async saveContext(context: PortfolioContext): Promise<void> {
    await Preferences.set({
      key: this.CONTEXT_KEY,
      value: JSON.stringify(context.toJSON())
    });
  }

  async getContext(): Promise<PortfolioContext | null> {
    const { value } = await Preferences.get({ key: this.CONTEXT_KEY });
    if (!value) {
      return null;
    }
    try {
      const json: PortfolioContextJSON = JSON.parse(value);
      return PortfolioContext.fromJSON(json);
    } catch (error) {
      return null;
    }
  }

  async clearContext(): Promise<void> {
    await Preferences.remove({ key: this.CONTEXT_KEY });
  }
}
```

#### 1.3 Create PortfolioContextService

**File:** `src/app/core/infrastructure/context/portfolio-context.service.ts`

Pattern: BehaviorSubject-based state service (similar to ViewportService)

Centralize Scope State with a Service

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { PortfolioContext, PortfolioContextType } from '../../domain/models/portfolio-context.model';
import { PortfolioContextStorageService } from '../persistence/portfolio-context-storage.service';
import { LoggerService } from '../logger/logger.service';

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
```

### Phase 2: API Layer - Add Team Context Support

#### 2.1 Update Product Repository Interface

**File:** `src/app/core/domain/repositories/product.repository.ts`

Add optional `teamId?: string` parameter to read operations:

```typescript
export abstract class ProductRepository {
  // ADD optional teamId parameter to read operations
  abstract getProducts(teamId?: string): Observable<ProductListItem[]>;
  abstract getProductById(id: string, teamId?: string): Observable<ProductListItem>;

  // Create/Update/Delete remain personal-only (no teamId)
  abstract createProduct(request: CreateProductRequest): Observable<CreateProductResponse>;
  abstract updateProduct(id: string, request: UpdateProductRequest): Observable<void>;
  abstract deleteProduct(id: string): Observable<void>;
  abstract updateProductStatus(id: string, active: boolean): Observable<void>;
  abstract addMovement(productId: string, request: AddMovementRequest): Observable<AddMovementResponse>;

  // Other methods...
}
```

#### 2.2 Update Product Repository Implementation

**File:** `src/app/core/infrastructure/repositories/product.repository.impl.ts`

```typescript
getProducts(teamId?: string): Observable<ProductListItem[]> {
  const options = teamId ? { params: { teamId } } : {};
  return this.get<ProductListItemApiResponse[]>(
    this.PRODUCTS_ENDPOINT,
    options
  ).pipe(
    map(responses => responses.map(response => ProductListItem.fromApiResponse(response)))
  );
}

getProductById(id: string, teamId?: string): Observable<ProductListItem> {
  const options = teamId ? { params: { teamId } } : {};
  return this.get<ProductListItemApiResponse>(
    `${this.PRODUCTS_ENDPOINT}/${id}`,
    options
  ).pipe(
    map(response => ProductListItem.fromApiResponse(response))
  );
}
```

#### 2.3 Update Balance History Repository

**File:** `src/app/core/infrastructure/repositories/balance-history.repository.impl.ts`

Similar pattern - add `teamId?: string` parameter to read methods:
- `getProductBalances(productId: string, filters: BalanceHistoryFilters, teamId?: string)`
- `getAllBalances(filters: BalanceHistoryFilters, teamId?: string)`

#### 2.4 Update Product UseCase

**File:** `src/app/core/domain/use-cases/product.use-case.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ProductUseCase {
  // Cache per context (personal vs team)
  private productsCacheMap = new Map<string, Observable<ProductListItem[]>>();
  private productsLoadingSubject = new BehaviorSubject<boolean>(false);
  public productsLoading$ = this.productsLoadingSubject.asObservable();

  constructor(
    private productRepository: ProductRepository,
    private portfolioContext: PortfolioContextService,
    private logger: LoggerService
  ) {}

  getProducts(): Observable<ProductListItem[]> {
    const context = this.portfolioContext.getCurrentContext();
    const cacheKey = context.isPersonal ? 'personal' : `team_${context.teamId}`;

    if (!this.productsCacheMap.has(cacheKey)) {
      this.productsLoadingSubject.next(true);
      const products$ = this.productRepository
        .getProducts(context.teamId || undefined)
        .pipe(
          tap(() => this.productsLoadingSubject.next(false)),
          tap(products => this.logger.info('Products loaded', 'ProductUseCase', {
            count: products.length,
            context: context.type,
            teamId: context.teamId
          })),
          shareReplay(1)
        );
      this.productsCacheMap.set(cacheKey, products$);
    }
    return this.productsCacheMap.get(cacheKey)!;
  }

  clearProductsCache(): void {
    this.productsCacheMap.clear();
    this.logger.info('Products cache cleared', 'ProductUseCase');
  }

  // Other methods remain unchanged...
}
```

#### 2.5 Update Balance History UseCase

Similar context-aware caching pattern.

### Phase 3: Context Switcher Component

#### 3.1 Create Component

**File:** `src/app/shared/components/portfolio-context-switcher/portfolio-context-switcher.component.ts`

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { PortfolioContextService } from 'src/app/core/infrastructure/context/portfolio-context.service';
import { TeamUseCase } from 'src/app/core/domain/use-cases/team.use-case';
import { ProductUseCase } from 'src/app/core/domain/use-cases/product.use-case';
import { ViewportService, SelectInterface } from 'src/app/core/infrastructure/viewport/viewport.service';
import { TeamWithMembers } from 'src/app/core/domain/models/team-with-members.model';
import { LoggerService } from 'src/app/core/infrastructure/logger/logger.service';

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
      // value format: "team_<teamId>"
      const teamId = value.replace('team_', '');
      const team = this.teams.find(t => t.id === teamId);
      if (team) {
        await this.portfolioContext.switchToTeam(team.id, team.name);
      }
    }

    // Clear caches to force refresh
    this.clearAllCaches();
  }

  private clearAllCaches(): void {
    this.productUseCase.clearProductsCache();
    // Add other use case cache clears as needed
    // this.balanceHistoryUseCase.clearCache();
  }

  getContextValue(): string {
    const context = this.portfolioContext.getCurrentContext();
    return context.isPersonal ? 'personal' : `team_${context.teamId}`;
  }
}
```

#### 3.2 Component Template

**File:** `src/app/shared/components/portfolio-context-switcher/portfolio-context-switcher.component.html`

```html
<div class="jbh-context-switcher">
  <ion-item lines="none" class="jbh-context-switcher-item">
    <ion-icon name="briefcase-outline" slot="start"></ion-icon>
    <ion-label class="jbh-context-label">
      {{ 'context.viewing' | translate }}
    </ion-label>
    <ion-select
      [value]="getContextValue()"
      (ionChange)="onContextChange($event)"
      [interface]="selectInterface"
      class="jbh-context-select">
      <ion-select-option value="personal">
        {{ 'context.personalPortfolio' | translate }}
      </ion-select-option>
      @for (team of teams; track team.id) {
        <ion-select-option [value]="'team_' + team.id">
          {{ team.name }}
        </ion-select-option>
      }
    </ion-select>
  </ion-item>
</div>
```

#### 3.3 Component Styles

**File:** `src/app/shared/components/portfolio-context-switcher/portfolio-context-switcher.component.scss`

```scss
.jbh-context-switcher {
  padding: var(--jbh-spacing-sm);
  border-bottom: 1px solid var(--jbh-border-color);
  background: var(--jbh-card-background);
}

.jbh-context-switcher-item {
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 0;
}

.jbh-context-select {
  max-width: 100%;
}

.jbh-context-label {
  font-size: 0.875rem;
  color: var(--jbh-text-secondary);
  margin-right: var(--jbh-spacing-xs);
}
```

#### 3.4 Integration into App Menu

**File:** `src/app/shared/components/app-menu/app-menu.component.html`

Add context switcher after header, before menu items:

```html
<div class="jbh-menu-header">
  <div class="jbh-menu-header-content">
    <h2 class="jbh-menu-title">{{ 'menu.appName' | translate }}</h2>
    <p class="jbh-menu-subtitle">{{ 'menu.appTagline' | translate }}</p>
  </div>
</div>

<!-- NEW: Context Switcher -->
<app-portfolio-context-switcher></app-portfolio-context-switcher>

<!-- Existing menu items -->
<div class="jbh-menu-content">
  <!-- menu items rendering -->
</div>
```

### Phase 4: Update Menu Component

#### 4.1 Update Menu Structure

**File:** `src/app/shared/components/app-menu/app-menu.component.ts`

```typescript
import { PortfolioContextService } from 'src/app/core/infrastructure/context/portfolio-context.service';

export class AppMenuComponent implements OnInit, OnDestroy {
  currentContext$ = this.portfolioContext.context$;
  menuItems: MenuItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private portfolioContext: PortfolioContextService,
    private translationService: TranslationService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.buildMenuItems();

    // Rebuild menu when context changes
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
          // Only show in personal context
          ...(context.isPersonal ? [{
            id: 'portfolio-add',
            translationKey: 'menu.portfolio.addNew',
            icon: 'add-circle-outline',
            route: '/portfolio/create'
          }] : [])
        ]
      },
      // Only show Transactions in personal context
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
          // Team Preferences only in team context
          ...(context.isTeam ? [{
            id: 'settings-team-preferences',
            translationKey: 'menu.settings.teamPreferences',
            icon: 'notifications-outline',
            route: '/settings/team-preferences'
          }] : []),
          // Team Management only in personal context
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

  // Existing methods...
}
```

**Update imports:**
```typescript
import { PortfolioContextSwitcherComponent } from '../portfolio-context-switcher/portfolio-context-switcher.component';

@Component({
  // ...
  imports: [
    CommonModule,
    IonicModule,
    RouterModule,
    TranslateModule,
    PortfolioContextSwitcherComponent // ADD THIS
  ],
  // ...
})
```

### Phase 5: Route Guards

#### 5.1 Create teamReadOnlyGuard

**File:** `src/app/core/guards/team-readonly.guard.ts`

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortfolioContextService } from '../infrastructure/context/portfolio-context.service';

export const teamReadOnlyGuard: CanActivateFn = (route, state) => {
  const portfolioContext = inject(PortfolioContextService);
  const router = inject(Router);

  if (portfolioContext.isTeamContext()) {
    // Redirect to dashboard when trying to access write operations in team context
    router.navigate(['/dashboard'], {
      queryParams: {
        message: 'team_readonly_restriction'
      }
    });
    return false;
  }

  return true;
};
```

#### 5.2 Update Routes

**File:** `src/app/app.routes.ts`

```typescript
import { teamReadOnlyGuard } from './core/guards/team-readonly.guard';

export const routes: Routes = [
  // Root redirect
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: []
  },

  // Auth pages
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.page').then(m => m.LoginPage),
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/pages/signup/signup.page').then(m => m.SignupPage),
    canActivate: [guestGuard]
  },

  // Dashboard (replaces home)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard]
  },

  // Portfolio (renamed from products)
  {
    path: 'portfolio/overview',
    loadComponent: () => import('./features/portfolio/pages/overview/portfolio-overview.page').then(m => m.PortfolioOverviewPage),
    canActivate: [authGuard]
  },
  {
    path: 'portfolio/create',
    loadComponent: () => import('./features/portfolio/pages/create/create-product.page').then(m => m.CreateProductPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },
  {
    path: 'portfolio/edit/:id',
    loadComponent: () => import('./features/portfolio/pages/edit/edit-product.page').then(m => m.EditProductPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },

  // Transactions (personal only)
  {
    path: 'transactions/transfer',
    loadComponent: () => import('./features/transactions/pages/transfer/transfer.page').then(m => m.TransferPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },
  {
    path: 'transactions/record-movement',
    loadComponent: () => import('./features/transactions/pages/record-movement/record-movement.page').then(m => m.RecordMovementPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },

  // Reports
  {
    path: 'reports/balance-trends',
    loadComponent: () => import('./features/reports/pages/balance-trends/balance-trends.page').then(m => m.BalanceTrendsPage),
    canActivate: [authGuard]
  },
  {
    path: 'reports/growth-analysis',
    loadComponent: () => import('./features/reports/pages/growth-analysis/growth-analysis.page').then(m => m.GrowthAnalysisPage),
    canActivate: [authGuard]
  },

  // Settings
  {
    path: 'settings/preferences',
    loadComponent: () => import('./features/settings/pages/preferences/preferences.page').then(m => m.PreferencesPage),
    canActivate: [authGuard]
  },
  {
    path: 'settings/team-preferences',
    loadComponent: () => import('./features/settings/pages/team-preferences/team-preferences.page').then(m => m.TeamPreferencesPage),
    canActivate: [authGuard]
  },
  {
    path: 'settings/teams/overview',
    loadComponent: () => import('./features/settings/pages/teams/overview/teams-overview.page').then(m => m.TeamsOverviewPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },
  {
    path: 'settings/teams/create',
    loadComponent: () => import('./features/settings/pages/teams/create/create-team.page').then(m => m.CreateTeamPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },
  {
    path: 'settings/teams/edit/:id',
    loadComponent: () => import('./features/settings/pages/teams/edit/edit-team.page').then(m => m.EditTeamPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },
  {
    path: 'settings/teams/invite',
    loadComponent: () => import('./features/settings/pages/teams/invite/invite-member.page').then(m => m.InviteMemberPage),
    canActivate: [authGuard, teamReadOnlyGuard] // PROTECTED
  },
  {
    path: 'settings/teams/:teamId/accept-invitation',
    loadComponent: () => import('./features/settings/pages/teams/accept-invitation/accept-invitation.page').then(m => m.AcceptInvitationPage),
    canActivate: [authGuard]
  },

  // Redirect old routes to new routes (for backwards compatibility)
  { path: 'home', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'profile', redirectTo: '/settings/preferences', pathMatch: 'full' },
  { path: 'products/overview', redirectTo: '/portfolio/overview', pathMatch: 'full' },
  { path: 'products/create', redirectTo: '/portfolio/create', pathMatch: 'full' },
  { path: 'products/edit/:id', redirectTo: '/portfolio/edit/:id', pathMatch: 'full' },
  { path: 'products/transfer', redirectTo: '/transactions/transfer', pathMatch: 'full' },
  { path: 'products/add-movement/:productId', redirectTo: '/transactions/record-movement', pathMatch: 'full' },
  { path: 'products/balance-history', redirectTo: '/reports/balance-trends', pathMatch: 'full' },
  { path: 'teams/overview', redirectTo: '/settings/teams/overview', pathMatch: 'full' },
  { path: 'teams/create', redirectTo: '/settings/teams/create', pathMatch: 'full' },
  { path: 'teams/edit/:id', redirectTo: '/settings/teams/edit/:id', pathMatch: 'full' },
  { path: 'teams/invite', redirectTo: '/settings/teams/invite', pathMatch: 'full' },
  { path: 'teams/:teamId/accept-invitation', redirectTo: '/settings/teams/:teamId/accept-invitation', pathMatch: 'full' },

  // 404 fallback
  { path: '**', redirectTo: '/dashboard' }
];
```

### Phase 6: Page Migrations & Reorganization

#### 6.1 File Structure Changes

```
src/app/features/
├── dashboard/                      [NEW FOLDER]
│   └── pages/
│       └── dashboard/
│           ├── dashboard.page.ts
│           ├── dashboard.page.html
│           └── dashboard.page.scss
│
├── portfolio/                      [RENAME from products/]
│   ├── pages/
│   │   ├── overview/
│   │   │   ├── portfolio-overview.page.ts    [RENAME from products-overview]
│   │   │   ├── portfolio-overview.page.html
│   │   │   └── portfolio-overview.page.scss
│   │   ├── create/
│   │   │   ├── create-product.page.ts        [KEEP - no rename needed]
│   │   │   ├── create-product.page.html
│   │   │   └── create-product.page.scss
│   │   └── edit/
│   │       ├── edit-product.page.ts
│   │       ├── edit-product.page.html
│   │       └── edit-product.page.scss
│   └── components/
│       └── product-card/
│
├── transactions/                   [NEW FOLDER]
│   └── pages/
│       ├── transfer/
│       │   ├── transfer.page.ts              [MOVE from products/pages/transfer]
│       │   ├── transfer.page.html
│       │   └── transfer.page.scss
│       └── record-movement/
│           ├── record-movement.page.ts        [MOVE & RENAME from products/pages/add-movement]
│           ├── record-movement.page.html
│           └── record-movement.page.scss
│
├── reports/                        [NEW FOLDER]
│   └── pages/
│       ├── balance-trends/
│       │   ├── balance-trends.page.ts        [MOVE & RENAME from products/pages/balance-history]
│       │   ├── balance-trends.page.html
│       │   └── balance-trends.page.scss
│       └── growth-analysis/
│           ├── growth-analysis.page.ts        [NEW - placeholder]
│           ├── growth-analysis.page.html
│           └── growth-analysis.page.scss
│
└── settings/                       [NEW FOLDER]
    └── pages/
        ├── preferences/
        │   ├── preferences.page.ts           [MOVE & RENAME from features/profile/pages/profile]
        │   ├── preferences.page.html
        │   └── preferences.page.scss
        ├── team-preferences/
        │   ├── team-preferences.page.ts      [NEW]
        │   ├── team-preferences.page.html
        │   └── team-preferences.page.scss
        └── teams/
            ├── overview/
            │   ├── teams-overview.page.ts    [MOVE & RENAME from features/teams/pages/overview]
            │   ├── teams-overview.page.html
            │   └── teams-overview.page.scss
            ├── create/
            │   ├── create-team.page.ts       [MOVE from features/teams/pages/create]
            │   ├── create-team.page.html
            │   └── create-team.page.scss
            ├── edit/
            │   ├── edit-team.page.ts
            │   ├── edit-team.page.html
            │   └── edit-team.page.scss
            ├── invite/
            │   ├── invite-member.page.ts
            │   ├── invite-member.page.html
            │   └── invite-member.page.scss
            └── accept-invitation/
                ├── accept-invitation.page.ts
                ├── accept-invitation.page.html
                └── accept-invitation.page.scss
```

#### 6.2 Component Renaming

| Old Component Class | New Component Class | Selector Change |
|---------------------|---------------------|-----------------|
| `ProductsOverviewPage` | `PortfolioOverviewPage` | `app-products-overview` → `app-portfolio-overview` |
| `OverviewTeamPage` | `TeamsOverviewPage` | `app-overview-team` → `app-teams-overview` |
| `ProfilePage` | `PreferencesPage` | `app-profile` → `app-preferences` |
| `BalanceHistoryPage` | `BalanceTrendsPage` | `app-balance-history` → `app-balance-trends` |
| `AddMovementPage` | `RecordMovementPage` | `app-add-movement` → `app-record-movement` |

### Phase 7: Component Updates for Context Awareness

#### 7.1 Portfolio Overview Page

**File:** `src/app/features/portfolio/pages/overview/portfolio-overview.page.ts`

Add context awareness:

```typescript
import { PortfolioContextService } from 'src/app/core/infrastructure/context/portfolio-context.service';

export class PortfolioOverviewPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  currentContext$ = this.portfolioContext.context$;
  isPersonalContext = true;

  constructor(
    private portfolioContext: PortfolioContextService,
    // ... other dependencies
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupSubscriptions();

    // Subscribe to context changes
    this.currentContext$
      .pipe(takeUntil(this.destroy$))
      .subscribe(context => {
        this.isPersonalContext = context.isPersonal;
        this.cdr.markForCheck();
      });
  }

  ionViewWillEnter(): void {
    this.refreshProducts(); // Will automatically use current context
  }

  // Hide create/edit/delete buttons in team context
  canModifyProducts(): boolean {
    return this.isPersonalContext;
  }

  navigateToCreate(): void {
    if (this.canModifyProducts()) {
      this.router.navigate(['/portfolio/create']);
    }
  }
}
```

Update template to hide action buttons:

```html
@if (canModifyProducts()) {
  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button (click)="navigateToCreate()">
      <ion-icon name="add"></ion-icon>
    </ion-fab-button>
  </ion-fab>
}

<!-- Product cards -->
@for (product of products; track product.id) {
  <app-product-card
    [product]="product"
    [showActions]="canModifyProducts()"
    (edit)="navigateToEdit($event)"
    (delete)="deleteProduct($event)"
    (addMovement)="navigateToAddMovement($event)">
  </app-product-card>
}
```

#### 7.2 Update Product Card Component

**File:** `src/app/features/portfolio/components/product-card/product-card.component.ts`

Add `@Input() showActions = true;` to conditionally show edit/delete buttons:

```html
@if (showActions) {
  <ion-button (click)="onEdit()">
    <ion-icon name="create-outline"></ion-icon>
  </ion-button>
  <ion-button (click)="onDelete()">
    <ion-icon name="trash-outline"></ion-icon>
  </ion-button>
}
```

#### 7.3 Balance Trends Page

**File:** `src/app/features/reports/pages/balance-trends/balance-trends.page.ts`

Add context awareness (read-only page, no action buttons to hide):

```typescript
import { PortfolioContextService } from 'src/app/core/infrastructure/context/portfolio-context.service';

export class BalanceTrendsPage implements OnInit, OnDestroy, ViewWillEnter {
  currentContext$ = this.portfolioContext.context$;

  constructor(
    private portfolioContext: PortfolioContextService,
    // ... other dependencies
  ) {}

  ionViewWillEnter(): void {
    this.loadBalanceData(); // Will automatically use current context via UseCase
  }
}
```

### Phase 8: New Pages

#### 8.1 Dashboard Page

**File:** `src/app/features/dashboard/pages/dashboard/dashboard.page.ts`

Create enhanced dashboard with context-aware summary:

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { ViewWillEnter } from '@ionic/angular';
import { PortfolioContextService } from 'src/app/core/infrastructure/context/portfolio-context.service';
import { ProductUseCase } from 'src/app/core/domain/use-cases/product.use-case';
import { LoggerService } from 'src/app/core/infrastructure/logger/logger.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit, OnDestroy, ViewWillEnter {
  currentContext$ = this.portfolioContext.context$;
  totalBalance = 0;
  activeProductsCount = 0;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private portfolioContext: PortfolioContextService,
    private productUseCase: ProductUseCase,
    private cdr: ChangeDetectorRef,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    // Setup any subscriptions
  }

  ionViewWillEnter(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.isLoading = true;

    combineLatest([
      this.productUseCase.getProducts(),
      this.currentContext$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([products, context]) => {
          this.activeProductsCount = products.filter(p => p.active).length;
          this.totalBalance = products.reduce((sum, p) => sum + (p.currentBalance || 0), 0);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.logger.error('Error loading dashboard data', 'Dashboard', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
```

**Template:**

```html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-menu-button></ion-menu-button>
    </ion-buttons>
    <ion-title>{{ 'menu.dashboard' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="jbh-container">
    @if (currentContext$ | async; as context) {
      <div class="jbh-dashboard-header">
        <h1>
          @if (context.isPersonal) {
            {{ 'dashboard.welcomePersonal' | translate }}
          } @else {
            {{ 'dashboard.welcomeTeam' | translate: { teamName: context.teamName } }}
          }
        </h1>
      </div>

      <div class="jbh-dashboard-summary">
        <ion-card class="jbh-card">
          <ion-card-header>
            <ion-card-subtitle>{{ 'dashboard.totalBalance' | translate }}</ion-card-subtitle>
            <ion-card-title>{{ totalBalance | jbhCurrency }}</ion-card-title>
          </ion-card-header>
        </ion-card>

        <ion-card class="jbh-card">
          <ion-card-header>
            <ion-card-subtitle>{{ 'dashboard.activeProducts' | translate }}</ion-card-subtitle>
            <ion-card-title>{{ activeProductsCount }}</ion-card-title>
          </ion-card-header>
        </ion-card>
      </div>

      <!-- Quick actions (only in personal context) -->
      @if (context.isPersonal) {
        <div class="jbh-dashboard-actions">
          <ion-button expand="block" routerLink="/portfolio/create" class="jbh-button-primary">
            <ion-icon name="add-circle-outline" slot="start"></ion-icon>
            {{ 'dashboard.addProduct' | translate }}
          </ion-button>
          <ion-button expand="block" routerLink="/transactions/record-movement" class="jbh-button-secondary">
            <ion-icon name="cash-outline" slot="start"></ion-icon>
            {{ 'dashboard.recordMovement' | translate }}
          </ion-button>
        </div>
      }
    }
  </div>
</ion-content>
```

#### 8.2 Team Preferences Page

**File:** `src/app/features/settings/pages/team-preferences/team-preferences.page.ts`

Placeholder implementation:

```typescript
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { ViewWillEnter } from '@ionic/angular';
import { PortfolioContextService } from 'src/app/core/infrastructure/context/portfolio-context.service';

@Component({
  selector: 'app-team-preferences',
  templateUrl: './team-preferences.page.html',
  styleUrls: ['./team-preferences.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamPreferencesPage implements OnInit, OnDestroy, ViewWillEnter {
  form!: FormGroup;
  currentContext$ = this.portfolioContext.context$;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private portfolioContext: PortfolioContextService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ionViewWillEnter(): void {
    // Load team preferences when entering page
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      notifications: [true],
      savingsGoal: [null],
      displayOptions: ['detailed']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      // Save team preferences
    }
  }
}
```

**Template:**

```html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/dashboard"></ion-back-button>
    </ion-buttons>
    <ion-title>{{ 'settings.teamPreferences.title' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="jbh-container">
    @if (currentContext$ | async; as context) {
      <div class="jbh-card">
        <h2>{{ 'settings.teamPreferences.forTeam' | translate: { teamName: context.teamName } }}</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Placeholder form fields -->
          <ion-item>
            <ion-label>{{ 'settings.teamPreferences.notifications' | translate }}</ion-label>
            <ion-toggle formControlName="notifications"></ion-toggle>
          </ion-item>

          <ion-button type="submit" expand="block" class="jbh-button-primary">
            {{ 'common.save' | translate }}
          </ion-button>
        </form>
      </div>
    }
  </div>
</ion-content>
```

#### 8.3 Growth Analysis Page (Placeholder)

**File:** `src/app/features/reports/pages/growth-analysis/growth-analysis.page.ts`

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-growth-analysis',
  templateUrl: './growth-analysis.page.html',
  styleUrls: ['./growth-analysis.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GrowthAnalysisPage {}
```

**Template:**

```html
<ion-header>
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/dashboard"></ion-back-button>
    </ion-buttons>
    <ion-title>{{ 'menu.reports.growthAnalysis' | translate }}</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div class="jbh-container">
    <div class="jbh-card">
      <ion-icon name="construct-outline" size="large"></ion-icon>
      <h2>{{ 'common.comingSoon' | translate }}</h2>
      <p>{{ 'reports.growthAnalysis.comingSoonMessage' | translate }}</p>
    </div>
  </div>
</ion-content>
```

### Phase 9: Translation Updates

#### 9.1 Update en.json

**File:** `src/assets/i18n/en.json`

Add new keys (alphabetically sorted):

```json
{
  "common": {
    "comingSoon": "Coming Soon",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  },
  "context": {
    "myPortfolio": "My Portfolio",
    "personalPortfolio": "Personal Portfolio",
    "switchingContext": "Switching portfolio context...",
    "teamPortfolio": "Team Portfolio",
    "viewing": "Viewing"
  },
  "dashboard": {
    "activeProducts": "Active Products",
    "addProduct": "Add Product",
    "recordMovement": "Record Movement",
    "totalBalance": "Total Balance",
    "welcomePersonal": "Welcome to your Dashboard",
    "welcomeTeam": "Welcome to {{teamName}} Dashboard"
  },
  "menu": {
    "appName": "JBH App",
    "appTagline": "Manage your business",
    "dashboard": "Dashboard",
    "logout": "Log Out",
    "logoutError": "Error logging out. Please try again.",
    "logoutSuccess": "You have been logged out successfully",
    "portfolio": {
      "addNew": "Add New Product",
      "title": "Portfolio",
      "viewAll": "View All Products"
    },
    "reports": {
      "balanceTrends": "Balance Trends",
      "growthAnalysis": "Growth Analysis",
      "title": "Reports"
    },
    "settings": {
      "myPreferences": "My Preferences",
      "teamManagement": {
        "addNew": "Add New Team",
        "invite": "Invite Members",
        "myTeams": "My Teams",
        "title": "Team Management"
      },
      "teamPreferences": "Team Preferences",
      "title": "Settings"
    },
    "transactions": {
      "recordMovement": "Record Movement",
      "title": "Transactions",
      "transfer": "Transfer Funds"
    },
    "version": "Version"
  },
  "portfolio": {
    "overview": {
      "createButton": "Add Product",
      "formSubtitle": "Manage your portfolio products",
      "formTitle": "Portfolio Overview"
    }
  },
  "reports": {
    "growthAnalysis": {
      "comingSoonMessage": "Growth analysis reports will be available soon."
    }
  },
  "settings": {
    "teamPreferences": {
      "forTeam": "Preferences for {{teamName}}",
      "notifications": "Notifications",
      "title": "Team Preferences"
    }
  },
  "transactions": {
    "recordMovement": {
      "title": "Record Movement"
    },
    "transfer": {
      "title": "Transfer Funds"
    }
  }
}
```

Remove deprecated keys:
- `menu.home`
- `menu.profile`
- `menu.products.*` (entire section)
- `menu.teams.*` (entire section)

Rename feature keys:
- Update `products.*` references to `portfolio.*`
- Update `teams.*` references to `settings.teams.*`
- Update `profile.*` references to `settings.preferences.*`

#### 9.2 Update es.json

**File:** `src/assets/i18n/es.json`

Mirror all changes in Spanish:

```json
{
  "common": {
    "comingSoon": "Próximamente",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar"
  },
  "context": {
    "myPortfolio": "Mi Cartera",
    "personalPortfolio": "Cartera Personal",
    "switchingContext": "Cambiando contexto de cartera...",
    "teamPortfolio": "Cartera de Equipo",
    "viewing": "Viendo"
  },
  "dashboard": {
    "activeProducts": "Productos Activos",
    "addProduct": "Agregar Producto",
    "recordMovement": "Registrar Movimiento",
    "totalBalance": "Balance Total",
    "welcomePersonal": "Bienvenido a tu Panel",
    "welcomeTeam": "Bienvenido al Panel de {{teamName}}"
  },
  "menu": {
    "appName": "JBH App",
    "appTagline": "Administra tu negocio",
    "dashboard": "Panel",
    "logout": "Cerrar Sesión",
    "logoutError": "Error al cerrar sesión. Por favor, inténtalo de nuevo.",
    "logoutSuccess": "Has cerrado sesión correctamente",
    "portfolio": {
      "addNew": "Agregar Nuevo Producto",
      "title": "Cartera",
      "viewAll": "Ver Todos los Productos"
    },
    "reports": {
      "balanceTrends": "Tendencias de Balance",
      "growthAnalysis": "Análisis de Crecimiento",
      "title": "Reportes"
    },
    "settings": {
      "myPreferences": "Mis Preferencias",
      "teamManagement": {
        "addNew": "Agregar Nuevo Equipo",
        "invite": "Invitar Miembros",
        "myTeams": "Mis Equipos",
        "title": "Gestión de Equipos"
      },
      "teamPreferences": "Preferencias del Equipo",
      "title": "Configuración"
    },
    "transactions": {
      "recordMovement": "Registrar Movimiento",
      "title": "Transacciones",
      "transfer": "Transferir Fondos"
    },
    "version": "Versión"
  },
  "portfolio": {
    "overview": {
      "createButton": "Agregar Producto",
      "formSubtitle": "Administra los productos de tu cartera",
      "formTitle": "Resumen de Cartera"
    }
  },
  "reports": {
    "growthAnalysis": {
      "comingSoonMessage": "Los reportes de análisis de crecimiento estarán disponibles pronto."
    }
  },
  "settings": {
    "teamPreferences": {
      "forTeam": "Preferencias para {{teamName}}",
      "notifications": "Notificaciones",
      "title": "Preferencias del Equipo"
    }
  },
  "transactions": {
    "recordMovement": {
      "title": "Registrar Movimiento"
    },
    "transfer": {
      "title": "Transferir Fondos"
    }
  }
}
```

### Phase 10: Critical Implementation Notes

1. **OnPush Change Detection**: All components MUST use `ChangeDetectionStrategy.OnPush`. Call `cdr.markForCheck()` after any state changes.

2. **Ionic Lifecycle**: Use `ionViewWillEnter()` for API calls, NOT `ngOnInit()`. Ionic reuses component instances.

3. **Subscription Management**: Always use `takeUntil(this.destroy$)` pattern. Implement `OnDestroy` properly.

4. **Cache Management**: Clear ALL use case caches when context switches. Use context-specific cache keys.

5. **Context Persistence**: Context is saved to Capacitor Preferences on every switch and restored on app initialization.

6. **File Naming**: Follow `[action]-[entity].page.ts` convention strictly.

7. **Component Naming**: Selector must match file name in kebab-case.

8. **Translation Parity**: Update both `en.json` AND `es.json` simultaneously. Keep keys alphabetically sorted.

9. **Route Guards**: Protect ALL write operations with `teamReadOnlyGuard`.

10. **Testing**: Test on iOS, Android, AND Web before considering complete.

11. **No Console Logs**: Use `LoggerService` instead of `console.*`.

12. **No Calculations**: All numeric calculations MUST be done on backend. Frontend only displays data.

13. **Use Pipes**: All formatting MUST use pipes (jbhCurrency, jbhTranslationKey), not getter methods.

14. **Track By**: ALWAYS use `track` in `@for` loops for performance.

## Implementation Order

**Week 1: Foundation**
- Create PortfolioContext model, storage service, state service
- Test context switching in isolation
- Verify storage persistence works

**Week 2: API Integration**
- Update repository interfaces and implementations
- Update use cases with context awareness and caching
- Test API calls with `teamId` parameter
- Verify cache invalidation works

**Week 3: UI Components**
- Create PortfolioContextSwitcher component
- Update AppMenu with dynamic menu building
- Test menu visibility rules in both contexts
- Verify menu rebuilds on context change

**Week 4: Route Guards & Structure**
- Create teamReadOnlyGuard
- Create new feature folders (dashboard, portfolio, transactions, reports, settings)
- Update app.routes.ts with new routes, guards, and redirects
- Test route protection

**Week 5: Page Migrations**
- Move and rename all existing pages to new locations
- Update imports and component names
- Create new pages (Dashboard, Team Preferences, Growth Analysis)
- Update all components for context awareness
- Update product card to hide actions conditionally

**Week 6: Translations & Testing**
- Update en.json and es.json with all new keys
- Remove deprecated keys
- Manual testing all scenarios (see Verification Steps)
- Mobile device testing (iOS, Android, Web)
- Bug fixes and polish

## Verification Steps

### Context Switching
- [ ] Switch from personal to team → menu updates immediately
- [ ] Switch back to personal → menu updates immediately
- [ ] Products list updates with team data
- [ ] Reload app → context persists from storage
- [ ] Logout → context clears and resets to personal

### Menu Visibility
- [ ] Personal context: All menu items visible including Transactions
- [ ] Personal context: "Add New Product" visible under Portfolio
- [ ] Personal context: Team Management visible under Settings
- [ ] Team context: Transactions menu completely hidden
- [ ] Team context: "Add New Product" hidden under Portfolio
- [ ] Team context: Team Preferences visible under Settings
- [ ] Team context: Team Management hidden

### Route Guards
- [ ] Personal: Can access `/portfolio/create`
- [ ] Team: Redirected from `/portfolio/create` to `/dashboard`
- [ ] Personal: Can access `/transactions/transfer`
- [ ] Team: Redirected from `/transactions/transfer` to `/dashboard`
- [ ] Personal: Can access `/transactions/record-movement`
- [ ] Team: Redirected from `/transactions/record-movement` to `/dashboard`
- [ ] Personal: Can access `/settings/teams/overview`
- [ ] Team: Redirected from `/settings/teams/overview` to `/dashboard`

### API Calls
- [ ] Personal context: Network tab shows `GET /finance/products` (no query params)
- [ ] Team context: Network tab shows `GET /finance/products?teamId=abc123`
- [ ] Verify correct data displayed for each context
- [ ] Switch contexts → new API call made with correct teamId
- [ ] Cache works within same context (no duplicate calls)

### Page Functionality
- [ ] Dashboard displays context-aware summary (personal vs team)
- [ ] Dashboard shows quick actions only in personal context
- [ ] Portfolio Overview shows products for current context
- [ ] Portfolio Overview hides edit/delete/add buttons in team context
- [ ] Balance Trends shows data for current context
- [ ] Team Preferences page only accessible in team context
- [ ] All pages responsive on mobile devices

### Old Routes Redirect
- [ ] `/home` redirects to `/dashboard`
- [ ] `/products/overview` redirects to `/portfolio/overview`
- [ ] `/products/create` redirects to `/portfolio/create`
- [ ] `/products/transfer` redirects to `/transactions/transfer`
- [ ] `/products/balance-history` redirects to `/reports/balance-trends`
- [ ] `/profile` redirects to `/settings/preferences`
- [ ] `/teams/overview` redirects to `/settings/teams/overview`

### Translation
- [ ] All menu items translated in EN
- [ ] All menu items translated in ES
- [ ] Context switcher translated in both languages
- [ ] Dashboard translated in both languages
- [ ] No missing translation keys (check console)
- [ ] Language switch works in both contexts

### Performance
- [ ] OnPush change detection working (verify with Angular DevTools)
- [ ] No unnecessary re-renders
- [ ] Cache prevents duplicate API calls
- [ ] Menu rebuilds quickly on context change
- [ ] Smooth animations on mobile

## Critical Files Summary

| File Path | Purpose |
|-----------|---------|
| `src/app/core/domain/models/portfolio-context.model.ts` | Domain model for context |
| `src/app/core/infrastructure/persistence/portfolio-context-storage.service.ts` | Persistent storage |
| `src/app/core/infrastructure/context/portfolio-context.service.ts` | **Central state management** |
| `src/app/core/domain/repositories/product.repository.ts` | Repository interface (add teamId) |
| `src/app/core/infrastructure/repositories/product.repository.impl.ts` | Repository implementation |
| `src/app/core/domain/use-cases/product.use-case.ts` | **Context-aware caching** |
| `src/app/shared/components/portfolio-context-switcher/*` | Context switcher component |
| `src/app/shared/components/app-menu/app-menu.component.ts` | **Dynamic menu building** |
| `src/app/core/guards/team-readonly.guard.ts` | Route protection |
| `src/app/app.routes.ts` | **Routes, guards, redirects** |
| `src/assets/i18n/en.json` | English translations |
| `src/assets/i18n/es.json` | Spanish translations |

## Risk Mitigation

1. **Breaking Changes**: Old routes redirect to new routes during migration period
2. **Cache Issues**: Clear all caches on context switch, use context-specific keys
3. **OnPush Detection**: Use `markForCheck()` and observables with async pipe
4. **Mobile Performance**: Lazy load features, use trackBy in loops, avoid expensive operations
5. **Translation Gaps**: Update both languages simultaneously, test language switching
6. **Data Loss**: Test logout clears context, test app reload restores context

## Data Flow Diagrams

### Context Switching Flow
```
User selects "Team Alpha" from dropdown
  ↓
PortfolioContextSwitcher.onContextChange('team_abc123')
  ↓
PortfolioContextService.switchToTeam('abc123', 'Team Alpha')
  ↓
1. Create new PortfolioContext(TEAM, 'abc123', 'Team Alpha')
2. Save to PortfolioContextStorageService (Capacitor Preferences)
3. Emit new context via BehaviorSubject
  ↓
All subscribers receive new context:
  ↓
AppMenuComponent.buildMenuItems()
  → Rebuilds menu with Transactions hidden
  → Shows Team Preferences
  → Hides Team Management
  ↓
PortfolioContextSwitcher.clearAllCaches()
  → ProductUseCase.clearProductsCache()
  → Other use cases clear their caches
  ↓
PortfolioOverviewPage receives context update
  → Sets isPersonalContext = false
  → Hides action buttons
  → Calls productUseCase.getProducts()
  ↓
ProductUseCase.getProducts()
  → Checks cache: Map.get('team_abc123') → miss
  → Calls repository.getProducts('abc123')
  ↓
Repository adds { params: { teamId: 'abc123' } }
  ↓
HTTP GET /finance/products?teamId=abc123
  ↓
Backend returns team's aggregated products
  ↓
UseCase caches with key 'team_abc123'
  ↓
UI updates with team data, action buttons hidden
```

### API Call Flow (Team Context)
```
Component: portfolioOverviewPage
  ↓
Calls: productUseCase.getProducts()
  ↓
UseCase reads: portfolioContext.getCurrentContext()
  → Returns: PortfolioContext(TEAM, 'abc123', 'Team Alpha')
  ↓
UseCase checks cache:
  cacheKey = 'team_abc123'
  Map.has('team_abc123') → false (cache miss)
  ↓
UseCase calls: repository.getProducts('abc123')
  ↓
Repository builds options:
  const options = { params: { teamId: 'abc123' } }
  ↓
Repository calls: ApiBaseService.get('/finance/products', options)
  ↓
ApiBaseService builds URL:
  baseUrl + '/finance/products?teamId=abc123'
  ↓
JwtInterceptor adds:
  - Authorization: Bearer <token>
  - withCredentials: true
  ↓
HTTP Request sent to backend
  ↓
Backend receives teamId, validates user membership, aggregates data
  ↓
Response: ProductListItemApiResponse[]
  ↓
Repository maps to: ProductListItem[]
  ↓
UseCase caches result:
  Map.set('team_abc123', Observable<ProductListItem[]>)
  ↓
Component receives: Observable<ProductListItem[]>
  ↓
Template renders: Product cards (read-only, no action buttons)
```

---

## Next Steps After Implementation

1. **User Testing**: Get feedback on context switching UX
2. **Performance Monitoring**: Check for any slowdowns on mobile
3. **Backend Work**: Implement team aggregation logic for all relevant endpoints
4. **Feature Expansion**: Implement Growth Analysis report
5. **Team Preferences**: Add actual preference settings (currently placeholder)

## Notes

- This plan maintains backwards compatibility with redirects
- All existing features continue to work in personal context
- Team context adds read-only team views without breaking personal functionality
- Implementation can be done incrementally, testing each phase before moving to next
