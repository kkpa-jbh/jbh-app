import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  shieldCheckmark,
  alertCircle,
  personOutline,
  informationCircle,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  logoGoogle
} from 'ionicons/icons';
import { AuthUseCase } from '@core/domain/use-cases/auth.use-case';
import { JBHError } from '@core/domain/models/jbh-error.model';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule
  ]
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  private returnUrl: string = '/home';

  constructor(
    private formBuilder: FormBuilder,
    private authUseCase: AuthUseCase,
    private router: Router,
    private route: ActivatedRoute,
    public translationService: TranslationService,
    private logger: LoggerService
  ) {
    addIcons({
      shieldCheckmark,
      alertCircle,
      personOutline,
      informationCircle,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      logoGoogle
    });
  }

  ngOnInit() {
    this.initForm();
    this.captureReturnUrl();
  }

  private captureReturnUrl(): void {
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        this.returnUrl = params['returnUrl'];
      }
    });
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
  async onLogin() {
    // Clear previous error
    this.errorMessage = '';

    // Validate form
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    this.authUseCase.login(username, password).subscribe({
      next: (user) => {
        this.logger.info('Login successful', 'LoginPage', user);
        this.isLoading = false;

        // Navigate to returnUrl or home
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.logger.error('Login failed:', 'LoginPage', error);
        this.isLoading = false;

        this.errorMessage = (error instanceof JBHError && error.isValidationError)
          ? error.message
          : this.translationService.instant('login.errors.invalidCredentials');
      }
    });
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
