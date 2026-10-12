import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, startWith, takeUntil } from 'rxjs/operators';
import { JbhIconComponent } from '@design-system/components';
import { JbhToolbarComponent } from '@design-system/platform';

import { PortfolioContextService } from '../../../core/infrastructure/context/portfolio-context.service';
import { HeaderActionsService } from '../../../core/infrastructure/header/header-actions.service';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, JbhIconComponent, JbhToolbarComponent]
})
export class AppHeaderComponent implements OnInit, OnDestroy {
  currentContext$ = this.portfolioContext.context$;
  pageConfig$ = this.headerActions.config$;
  shouldShowHeader$!: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    private portfolioContext: PortfolioContextService,
    private headerActions: HeaderActionsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.shouldShowHeader$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: NavigationEnd) => {
        return !event.url.includes('/login') && !event.url.includes('/signup');
      }),
      startWith(!this.router.url.includes('/login') && !this.router.url.includes('/signup')),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
