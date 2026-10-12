import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { GoogleSignInService } from '@core/infrastructure/auth/google-sign-in.service';
import { JbhAlertComponent, JbhButtonComponent, JbhIconComponent, JbhTextFieldComponent } from '@design-system/components';
import { JbhPageComponent } from '@design-system/platform';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    JbhAlertComponent,
    JbhButtonComponent,
    JbhIconComponent,
    JbhPageComponent,
    JbhTextFieldComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('googleButton') googleButton?: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  readonly currentYear = new Date().getFullYear();
  private returnUrl: string = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private authUseCase: AuthUseCase,
    private router: Router,
    private route: ActivatedRoute,
    public translationService: TranslationService,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef,
    private googleSignIn: GoogleSignInService
  ) {}

  ngOnInit() {
    this.initForm();
    this.captureReturnUrl();
  }

  private captureReturnUrl(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['returnUrl']) {
          this.returnUrl = params['returnUrl'];
        }
      });
  }

  get googleEnabled(): boolean {
    return this.googleSignIn.isEnabled;
  }

  ngAfterViewInit(): void {
    if (!this.googleButton) return;
    this.googleSignIn
      .renderButton(this.googleButton.nativeElement, 'continue_with', idToken => this.onGoogleCredential(idToken))
      .catch(error => this.logger.error('Google button failed to load', 'LoginPage', error));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize login form with validators
   */
  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Handle login form submission
   */
  onLogin(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    const { username, password } = this.loginForm.value;

    this.authUseCase.login(username, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.logger.info('Login successful', 'LoginPage', user);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          this.logger.error('Login failed:', 'LoginPage', error);
          this.isLoading = false;
          this.errorMessage = (error instanceof JBHError && error.isValidationError)
            ? error.message
            : this.translationService.instant('login.errors.invalidCredentials');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Handle the ID token returned by Google's button
   */
  private onGoogleCredential(idToken: string): void {
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    this.authUseCase.loginWithGoogle(idToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.logger.info('Google login successful', 'LoginPage', user);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (error) => {
          this.logger.error('Google login failed:', 'LoginPage', error);
          this.isLoading = false;
          this.errorMessage = this.translationService.instant('login.errors.google');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Check if a field has error and is touched
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`login.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`login.${fieldName}.minlength`, { minLength });
    }
    return this.translationService.instant('validation.pattern');
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
