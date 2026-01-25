import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from '../logging/logger.service';

/**
 * Service for managing application internationalization (i18n)
 * Provides language switching and translation capabilities
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {

  private currentLanguage$ = new BehaviorSubject<string>('en');
  private readonly STORAGE_KEY = 'app_language';

  // Available languages
  readonly availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];

  constructor(
    private translate: TranslateService,
    private logger: LoggerService
  ) {
    this.initializeLanguage();
  }

  /**
   * Initialize language from storage or browser default
   */
  private initializeLanguage(): void {
    // Get saved language from storage
    const savedLanguage = localStorage.getItem(this.STORAGE_KEY);

    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.setLanguage(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = this.translate.getBrowserLang();
      const defaultLang = browserLang && this.isLanguageSupported(browserLang)
        ? browserLang
        : 'en';
      this.setLanguage(defaultLang);
    }
  }

  /**
   * Set current language
   */
  setLanguage(language: string): void {
    if (!this.isLanguageSupported(language)) {
      this.logger.warn(`Language ${language} is not supported. Falling back to English.`, 'Translation');
      language = 'en';
    }

    this.translate.use(language);
    this.currentLanguage$.next(language);
    localStorage.setItem(this.STORAGE_KEY, language);
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguage$.value;
  }

  /**
   * Get current language as observable
   */
  getCurrentLanguage$(): Observable<string> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Check if language is supported
   */
  private isLanguageSupported(language: string): boolean {
    return this.availableLanguages.some(lang => lang.code === language);
  }

  /**
   * Get translation for a key
   */
  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  /**
   * Get translation as observable
   */
  get(key: string, params?: any): Observable<string> {
    return this.translate.get(key, params);
  }

  /**
   * Toggle between available languages
   */
  toggleLanguage(): void {
    const currentLang = this.getCurrentLanguage();
    const nextLang = currentLang === 'en' ? 'es' : 'en';
    this.setLanguage(nextLang);
  }
}
