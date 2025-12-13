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
    loadComponent: () => import('./features/products/pages/create/create.page').then(m => m.CreatePage),
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
];
