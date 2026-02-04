import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '@core/infrastructure/i18n/translation.service';

interface TranslationKeyObject {
  en: string;
  es: string;
}

@Pipe({
  name: 'jbhTranslationKey',
  standalone: true,
  pure: false
})
export class JbhTranslationKeyPipe implements PipeTransform {
  private cachedJson: string | null = null;
  private cachedLang: string | null = null;
  private cachedResult: string = '';

  constructor(private translationService: TranslationService) {}

  transform(jsonString: string | null | undefined): string {
    if (!jsonString) return '';

    const currentLang = this.translationService.getCurrentLanguage();

    if (this.cachedJson === jsonString && this.cachedLang === currentLang) {
      return this.cachedResult;
    }

    try {
      const parsed: TranslationKeyObject = JSON.parse(jsonString);
      this.cachedJson = jsonString;
      this.cachedLang = currentLang;
      this.cachedResult = currentLang === 'es' ? parsed.es : parsed.en;
      return this.cachedResult;
    } catch {
      return jsonString;
    }
  }
}
