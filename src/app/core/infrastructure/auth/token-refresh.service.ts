import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, Subject, from, of, firstValueFrom } from 'rxjs';
import { take, map, catchError, tap } from 'rxjs/operators';
import { TokenStorageService } from '../persistence/token-storage.service';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { LoggerService } from '../logging/logger.service';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService {
  private isRefreshing$ = new BehaviorSubject<boolean>(false);
  private refreshResult$ = new Subject<boolean>();

  constructor(
    private tokenStorage: TokenStorageService,
    private authRepository: AuthRepository,
    private platform: Platform,
    private router: Router,
    private logger: LoggerService
  ) {}

  get isRefreshing(): boolean {
    return this.isRefreshing$.value;
  }

  waitForRefresh(): Observable<void> {
    if (!this.isRefreshing$.value) {
      return of(undefined);
    }
    return this.refreshResult$.pipe(
      take(1),
      map(() => undefined)
    );
  }

  refreshToken(): Observable<boolean> {
    if (this.isRefreshing$.value) {
      return this.refreshResult$.pipe(take(1));
    }

    this.isRefreshing$.next(true);
    this.logger.debug('Token refresh started', 'TokenRefreshService');

    return from(this.performRefresh()).pipe(
      tap(success => {
        this.isRefreshing$.next(false);
        this.refreshResult$.next(success);
        this.logger.debug(`Token refresh completed: ${success ? 'success' : 'failed'}`, 'TokenRefreshService');
      }),
      catchError(error => {
        this.logger.error('Token refresh error', 'TokenRefreshService', error);
        this.isRefreshing$.next(false);
        this.refreshResult$.next(false);
        return of(false);
      })
    );
  }

  async handleLogout(): Promise<void> {
    this.isRefreshing$.next(false);
    await this.tokenStorage.clearTokens();
    this.router.navigate(['/login']);
  }

  private async performRefresh(): Promise<boolean> {
    const isMobile = this.platform.is('capacitor');
    let refreshToken: string | undefined;

    if (isMobile) {
      refreshToken = await this.tokenStorage.getRefreshToken() || undefined;
      if (!refreshToken) {
        this.logger.error('No refresh token in storage', 'TokenRefreshService');
        return false;
      }
      this.logger.debug('Using refresh token from secure storage', 'TokenRefreshService');
    } else {
      this.logger.debug('Using refresh token from HTTP-only cookie', 'TokenRefreshService');
    }

    try {
      const newToken = await firstValueFrom(this.authRepository.refreshToken(refreshToken));
      if (newToken) {
        await this.tokenStorage.saveToken(newToken);
        this.logger.debug('New tokens saved successfully', 'TokenRefreshService');
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to refresh token', 'TokenRefreshService', error);
      return false;
    }
  }
}
