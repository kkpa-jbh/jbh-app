import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { JbhButtonComponent, JbhCardComponent, JbhToggleComponent } from '@design-system/components';
import { JbhPageComponent } from '@design-system/platform';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-team-preferences',
  templateUrl: './team-preferences.page.html',
  styleUrls: ['./team-preferences.page.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateModule,
    ReactiveFormsModule,
    JbhButtonComponent,
    JbhCardComponent,
    JbhPageComponent,
    JbhToggleComponent,
    AppHeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamPreferencesPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly portfolioContext = inject(PortfolioContextService);
  private readonly headerActions = inject(HeaderActionsService);

  form!: FormGroup;
  currentContext$ = this.portfolioContext.context$;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
  }

  onPageEnter(): void {
    this.headerActions.setPageConfig({
      title: 'settings.teamPreferences.title'
    });
  }

  onPageLeave(): void {
    this.headerActions.clearPageConfig();
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
      // Placeholder for future implementation
    }
  }
}
