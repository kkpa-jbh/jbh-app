import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { PortfolioContextService } from '@core/infrastructure/context/portfolio-context.service';
import { HeaderActionsService } from '@core/infrastructure/header/header-actions.service';
import { AppHeaderComponent } from '@shared/components/app-header/app-header.component';

@Component({
  selector: 'app-team-preferences',
  templateUrl: './team-preferences.page.html',
  styleUrls: ['./team-preferences.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule, ReactiveFormsModule, AppHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamPreferencesPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  form!: FormGroup;
  currentContext$ = this.portfolioContext.context$;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private portfolioContext: PortfolioContextService,
    private headerActions: HeaderActionsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ionViewWillEnter(): void {
    this.headerActions.setPageConfig({
      title: 'settings.teamPreferences.title'
    });
  }

  ionViewWillLeave(): void {
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
