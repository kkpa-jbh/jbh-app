import { Routes } from '@angular/router';
import { authGuard, guestGuard, rootRedirectGuard } from './core/guards/auth.guard';
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
    loadComponent: () => import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/pages/signup/signup.page').then((m) => m.SignupPage),
    canActivate: [guestGuard]
  },

  // Dashboard (replaces home)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard]
  },

  // Portfolio routes (renamed from products)
  {
    path: 'portfolio/overview',
    loadComponent: () => import('./features/products/pages/overview/products-overview.page').then(m => m.ProductsOverviewPage),
    canActivate: [authGuard]
  },
  {
    path: 'portfolio/create',
    loadComponent: () => import('./features/products/pages/create/create-product.page').then(m => m.CreateProductPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },
  {
    path: 'portfolio/edit/:id',
    loadComponent: () => import('./features/products/pages/edit/edit-product.page').then(m => m.EditProductPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },

  // Transactions (personal only)
  {
    path: 'transactions/transfer',
    loadComponent: () => import('./features/products/pages/transfer/transfer.page').then(m => m.TransferPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },
  {
    path: 'transactions/record-movement',
    loadComponent: () => import('./features/products/pages/add-movement/add-movement.page').then(m => m.AddMovementPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },

  // Reports
  {
    path: 'reports/balance-trends',
    loadComponent: () => import('./features/products/pages/balance-history/balance-history.page').then(m => m.BalanceHistoryPage),
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
    loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
  {
    path: 'settings/team-preferences',
    loadComponent: () => import('./features/settings/pages/team-preferences/team-preferences.page').then(m => m.TeamPreferencesPage),
    canActivate: [authGuard]
  },
  {
    path: 'settings/teams/overview',
    loadComponent: () => import('./features/teams/pages/overview/overview-team.page').then(m => m.OverviewTeamPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },
  {
    path: 'settings/teams/create',
    loadComponent: () => import('./features/teams/pages/create/create-team.page').then(m => m.CreateTeamPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },
  {
    path: 'settings/teams/edit/:id',
    loadComponent: () => import('./features/teams/pages/edit/edit-team.page').then(m => m.EditTeamPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },
  {
    path: 'settings/teams/invite',
    loadComponent: () => import('./features/teams/pages/invite/invite-member.page').then(m => m.InviteMemberPage),
    canActivate: [authGuard, teamReadOnlyGuard]
  },
  {
    path: 'settings/teams/:teamId/accept-invitation',
    loadComponent: () => import('./features/teams/pages/accept-invitation/accept-invitation.page').then(m => m.AcceptInvitationPage),
    canActivate: [authGuard]
  },

  // Redirect old routes to new routes (backwards compatibility)
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
