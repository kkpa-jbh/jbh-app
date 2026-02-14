import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  personAdd,
  alertCircle,
  personOutline,
  atOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircle,
  closeCircle,
  informationCircle
} from 'ionicons/icons';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';
import { Subject, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupPage implements OnInit, OnDestroy {

  signupForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  usernameAvailable: boolean | null = null;
  emailAvailable: boolean | null = null;
  checkingUsername = false;
  checkingEmail = false;

  private usernameCheck$ = new Subject<string>();
  private emailCheck$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authUseCase: AuthUseCase,
    private router: Router,
    public translationService: TranslationService,
    private logger: LoggerService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      personAdd,
      alertCircle,
      personOutline,
      atOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircle,
      closeCircle,
      informationCircle
    });
  }

  ngOnInit() {
    this.initForm();
    this.setupAvailabilityChecks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  private setupAvailabilityChecks(): void {
    this.usernameCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(username => {
        if (!username || username.length < 3) {
          this.usernameAvailable = null;
          this.cdr.markForCheck();
          return of(null);
        }
        this.checkingUsername = true;
        this.cdr.markForCheck();
        return this.authUseCase.checkUsernameAvailability(username).pipe(
          catchError(() => of({ available: true }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.checkingUsername = false;
      if (result !== null) {
        this.usernameAvailable = result.available;
        if (!result.available) {
          this.signupForm.get('username')?.setErrors({ unavailable: true });
        }
      }
      this.cdr.markForCheck();
    });

    this.emailCheck$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !this.isValidEmail(email)) {
          this.emailAvailable = null;
          this.cdr.markForCheck();
          return of(null);
        }
        this.checkingEmail = true;
        this.cdr.markForCheck();
        return this.authUseCase.checkEmailAvailability(email).pipe(
          catchError(() => of({ available: true }))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.checkingEmail = false;
      if (result !== null) {
        this.emailAvailable = result.available;
        if (!result.available) {
          this.signupForm.get('email')?.setErrors({ unavailable: true });
        }
      }
      this.cdr.markForCheck();
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onUsernameInput(): void {
    const username = this.signupForm.get('username')?.value;
    this.usernameAvailable = null;
    this.usernameCheck$.next(username);
  }

  onEmailInput(): void {
    const email = this.signupForm.get('email')?.value;
    this.emailAvailable = null;
    this.emailCheck$.next(email);
  }

  onSignup(): void {
    this.errorMessage = '';

    if (this.signupForm.invalid) {
      this.markFormGroupTouched(this.signupForm);
      return;
    }

    if (this.usernameAvailable === false || this.emailAvailable === false) {
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    const { name, username, email, password } = this.signupForm.value;

    const signupData = {
      name,
      username,
      email,
      password
    };

    this.authUseCase.register(signupData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.logger.info('Registration successful', 'SignupPage');
          this.autoLogin(email, password);
        },
        error: (error) => {
          this.logger.error('Registration failed:', 'SignupPage', error);
          this.isLoading = false;
          this.errorMessage = (error instanceof JBHError && error.isValidationError)
            ? error.message
            : this.translationService.instant('signup.errors.generic');
          this.cdr.markForCheck();
        }
      });
  }

  private autoLogin(email: string, password: string): void {
    this.authUseCase.login(email, password)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.logger.info('Auto-login successful after registration', 'SignupPage', user);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.logger.error('Auto-login failed:', 'SignupPage', error);
          this.isLoading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/login']);
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.signupForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return this.translationService.instant(`signup.${fieldName}.required`);
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return this.translationService.instant(`signup.${fieldName}.minlength`, { minLength });
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return this.translationService.instant(`signup.${fieldName}.maxlength`, { maxLength });
    }
    if (field.hasError('email')) {
      return this.translationService.instant('validation.email');
    }
    if (field.hasError('pattern')) {
      return this.translationService.instant(`signup.${fieldName}.pattern`);
    }
    if (field.hasError('unavailable')) {
      return this.translationService.instant(`signup.${fieldName}.unavailable`);
    }
    if (field.hasError('passwordMismatch')) {
      return this.translationService.instant('signup.confirmPassword.mismatch');
    }
    return this.translationService.instant('validation.pattern');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
