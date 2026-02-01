import { Routes } from '@angular/router';
import { authGuard, guestGuard, rootRedirectGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [rootRedirectGuard], // Redirects to home if authenticated, login if not
    children: [] // Empty children to allow guard to execute
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [guestGuard] // Redirect to home if already logged in
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/pages/signup/signup.page').then((m) => m.SignupPage),
    canActivate: [guestGuard] // Redirect to home if already logged in
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'products/create',
    loadComponent: () => import('./features/products/pages/create/create-product.page').then(m => m.CreateProductPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'products/overview',
    loadComponent: () => import('./features/products/pages/overview/overview.page').then(m => m.OverviewPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'products/transfer',
    loadComponent: () => import('./features/products/pages/transfer/transfer.page').then(m => m.TransferPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'teams/create',
    loadComponent: () => import('./features/teams/pages/create/create-team.page').then(m => m.CreateTeamPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'teams/overview',
    loadComponent: () => import('./features/teams/pages/overview/overview-team.page').then(m => m.OverviewTeamPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'teams/edit/:id',
    loadComponent: () => import('./features/teams/pages/edit/edit-team.page').then(m => m.EditTeamPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'teams/invite',
    loadComponent: () => import('./features/teams/pages/invite/invite-member.page').then(m => m.InviteMemberPage),
    canActivate: [authGuard] // Requires authentication
  },
  {
    path: 'teams/:teamId/accept-invitation',
    loadComponent: () => import('./features/teams/pages/accept-invitation/accept-invitation.page').then(m => m.AcceptInvitationPage),
    canActivate: [authGuard] // Requires authentication - will redirect to login with returnUrl if not authenticated
  },
];
